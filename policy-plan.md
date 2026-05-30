# NCSU Policy — Policy LLM page

## Context

Add a new "Projects" nav entry **NCSU Policy** that opens a password-gated page (single env var `POLICY_LLM_PASSWORD`, no full user system) for searching the North Country Supervisory Union policy library at https://www.ncsuvt.org/27829_1.

User-facing flow:

1. Press **Sync** → server scrapes the index page, downloads each linked PDF, parses text, splits into sections + chunks, embeds them with LM Studio (`mxbai-embed-large-v1`, 1024-dim) and stores everything in Postgres. **Incremental**: a content-hash per document is stored so subsequent syncs only re-process changed files. PDF bytes are *not* persisted — only parsed text + the original Drive URL so the user can click through to the source.
2. Ask a question → server embeds the query, finds top-matching chunks via pgvector + a keyword pass on titles/sections, feeds them to LM Studio chat completion (`openai/gpt-oss-120b`) and returns a RAG answer with citations linking to the original Drive PDFs.

The index page groups policies into 8–10 lettered sections (A FOUNDATIONS, B BOARD GOVERNANCE, …, J HEALTH). Links are Google Drive (`drive.google.com/file/d/<ID>/view?…`) and a few Google Docs. For Drive files we download via `https://drive.google.com/uc?export=download&id=<ID>` (handling the "virus scan" interstitial for files over a few MB by following the `confirm` form on the HTML response). For Docs we use `https://docs.google.com/document/d/<ID>/export?format=pdf`.

## Dependencies to add

- **`unpdf`** — modern, dependency-free PDF text extraction that works in Node and serverless. Preferred over `pdf-parse` (test-file requirement bug, stale).
- **`react-icons/md`** (already used) — add `MdGavel` (or `MdPolicy`) for the new nav item. No new package.
- **pgvector** Postgres extension — ✅ **already installed** (v0.8.2) on the `postgres` database in Coolify; the image was swapped to `pgvector/pgvector:pg17` and `CREATE EXTENSION vector;` was run. The migration will still include `CREATE EXTENSION IF NOT EXISTS vector;` (idempotent) so fresh DBs work. Drizzle 0.44 has native `vector('embedding', { dimensions: 1024 })` support in `drizzle-orm/pg-core`.

LM Studio is reached over plain `fetch` to `${LM_STUDIO_API_URL}/embeddings` and `/chat/completions` — no SDK needed. It speaks the OpenAI shape.

## Files to add / modify

### 1. Nav
- **`lib/copy.ts`** — append a fourth entry to the `Projects` `subItems` array (after Travel Budget):
  ```ts
  { label: 'NCSU Policy', href: '/policy', icon: MdGavel }
  ```
  Add `MdGavel` to the `react-icons/md` import line. No changes needed in `components/HeaderNav.tsx` — it already renders `subItems` recursively.

### 2. Password gate (mirror the existing toxiproxy pattern)
The toxiproxy admin page already implements exactly the gate the user wants: env-var password, sent via header, cached in `sessionStorage`. Reuse this pattern verbatim — don't reinvent.

- **`lib/policyServer.ts`** (new) — small server helper exporting `verifyPolicyPassword(provided)` modeled on `verifyToxiproxyPassword` in `lib/toxiproxyServer.ts:143`. Reads `process.env.POLICY_LLM_PASSWORD`.
- Every `pages/api/policy/*` handler reads `x-policy-password` from headers and calls `verifyPolicyPassword` first (return 401/503 on failure).
- Client page stores the password in `window.sessionStorage` under key `policy-llm-password` and attaches it to every API call (same as `pages/toxiproxyDelay.tsx:32`).

### 3. Database
- **`lib/db/schema/policy.ts`** (new) — four tables, then re-export from `lib/db/schema/index.ts`:

  - **`policy_topics`** — the A–J lettered sections from the index page.
    `id uuid pk`, `code varchar(8) unique` (e.g. `"A"`), `name varchar(200)` (`"FOUNDATIONS"`), `ordinal int`.

  - **`policy_documents`** — one row per PDF link on the index.
    `id uuid pk`, `topic_id uuid → policy_topics.id`, `policy_code varchar(32)` (e.g. `"A.01"`), `title text`, `source_url text` (original Drive/Docs link, shown to user for "view original"), `download_url text` (resolved direct-download URL), `content_hash varchar(64)` (sha256 of the downloaded PDF bytes — drives incremental sync), `parsed_text text`, `last_synced_at timestamp`, `created_at`, `updated_at`. Unique index on `source_url`.

  - **`policy_sections`** — section headings discovered while parsing each PDF (best-effort: split on heading-like patterns or just paragraph blocks if the PDF has no structure).
    `id uuid pk`, `document_id uuid → policy_documents.id on delete cascade`, `ordinal int`, `heading text`, `content text`.

  - **`policy_chunks`** — embedded units used at search time. One row per chunk; a chunk is either the doc title, a section heading, or a ~500-token slice of body text.
    `id uuid pk`, `document_id uuid → policy_documents.id on delete cascade`, `section_id uuid → policy_sections.id null`, `kind varchar(16)` (`"title" | "heading" | "body"`), `content text`, `embedding vector(1024)`. HNSW index on `embedding` using `vector_cosine_ops`.

  Re-parsing on a changed `content_hash` deletes that document's `policy_sections` + `policy_chunks` (via `on delete cascade`) and re-inserts.

- **`lib/db/migrations/000X_policy_llm.sql`** (generated via `pnpm db:generate`) — start with `CREATE EXTENSION IF NOT EXISTS vector;` (add manually after `db:generate`), then the four tables and the HNSW index. Existing migration dir: `lib/db/migrations/`.

### 4. Page
- **`pages/policy/index.tsx`** (new) — single-page UI with three states gated on a stored password:
  1. **Password prompt** if `sessionStorage` is empty or last request 401'd.
  2. **Sync panel** showing last sync time, doc count by topic, a **Sync** button, and a progress strip (polls `/api/policy/sync/status` every 1–2 s while a job is running). Disable the button while a job is in progress.
  3. **Ask panel** — a textarea + Submit, a streamed/loaded answer area, and a citations list of `{ policy_code, title, source_url }`.

  Use existing Mantine components for layout consistency with other project pages (see `pages/toxiproxyDelay.tsx`, `pages/solar/`).

### 5. API routes (Pages Router, under `pages/api/policy/`)
All check `x-policy-password` first. Import `db` from `@/lib/db` and schema from `@/lib/db/schema` — same pattern as `pages/api/projects/index.ts:12`.

- **`sync.ts`** — `POST`. Reads the current job row from `policy_sync_jobs` (a 5th tiny table: `id, status, total, completed, message, started_at, finished_at`); if a job is `running`, returns 409. Otherwise inserts a `running` row, kicks off the sync **without awaiting** (fire-and-forget Promise), returns the job id. Body of the async work:
  1. Fetch the index HTML, parse with a lightweight regex / `cheerio` (already-installed deps suffice — fall back to a regex over `<a href=… >text</a>` blocks under each lettered heading).
  2. For each link: resolve direct-download URL, GET bytes, compute sha256.
  3. If hash matches the stored row, skip. Otherwise: parse PDF with `unpdf`, split into sections + chunks, embed (batch ≤32 inputs per LM Studio call), and upsert.
  4. Update the job row's `completed` counter after each doc.

- **`sync/status.ts`** — `GET`. Returns the latest `policy_sync_jobs` row.

- **`documents.ts`** — `GET`. Returns `[{topic, policy_code, title, source_url, last_synced_at}, …]` grouped by topic. Used to render the catalog on the sync panel.

- **`search.ts`** — `POST { question }`. Embeds the question, runs:
  ```sql
  SELECT chunk.*, doc.title, doc.source_url, doc.policy_code,
         1 - (embedding <=> $1) AS score
  FROM policy_chunks chunk
  JOIN policy_documents doc ON doc.id = chunk.document_id
  ORDER BY embedding <=> $1
  LIMIT 12;
  ```
  Also runs a Postgres FTS pass (`to_tsvector('english', title || ' ' || coalesce(parsed_text,''))`) and merges by document id, preferring the higher score. Builds a RAG prompt:
  ```
  Answer the user's question using only the policy excerpts below.
  Cite policies by their code (e.g., "A.01"). If unsure, say so.

  <excerpts>
  ...top 6 chunks with policy_code + content...
  </excerpts>

  Question: ...
  ```
  Calls `${LM_STUDIO_API_URL}/chat/completions` with `model: process.env.CHAT_MODEL_NAME`, returns `{ answer, citations: [{policy_code, title, source_url}] }`.

### 6. Small server helpers
- **`lib/policy/scrape.ts`** — `fetchPolicyIndex()` → `[{ topicCode, topicName, policyCode, title, sourceUrl }]`. Pure HTML parsing.
- **`lib/policy/download.ts`** — `downloadPolicyPdf(sourceUrl)` → `Uint8Array`. Handles Drive vs Docs URL normalization and the Drive confirm interstitial.
- **`lib/policy/lmStudio.ts`** — `embed(texts: string[])` and `chat(messages)`. Thin fetch wrappers over `LM_STUDIO_API_URL` using `LM_STUDIO_API_KEY` as `Authorization: Bearer …`.
- **`lib/policy/chunk.ts`** — `splitIntoChunks(text, maxTokens = 500)`. Simple paragraph + token-approx splitter; section headings detected via a regex on the parsed text.

## Implementation phasing (avoid hammering Drive & LM Studio)

We will *not* build the full sync loop on day one. The expensive parts (Drive downloads, PDF parsing, embedding tokens) get exercised incrementally so we can iterate on the parse/chunk/embed pipeline against a single known file before unleashing it on ~100 PDFs.

- **Phase 0 — fixture file on disk.** Pick one representative policy (e.g. `B.04 Board Member Conflict of Interest`), download it manually once, and store it under `lib/policy/__fixtures__/B.04.pdf` (gitignored — add `lib/policy/__fixtures__/` to `.gitignore`). All early development reads bytes from this file, not from Drive. This keeps `unpdf`, the section splitter, the chunker, the embedding call, and the upsert path all testable in a tight loop without any network beyond LM Studio.
- **Phase 1 — single-file pipeline.** Build everything end-to-end for just that one fixture: parse → split into sections → chunk → embed → write to DB → answer one question via `/api/policy/search`. The Sync API in this phase ignores the scraped index entirely and only processes the fixture. Verify citations resolve, the chunks look right, and search returns sensible results.
- **Phase 2 — real download for one file.** Swap the fixture read for a real `downloadPolicyPdf(sourceUrl)` call, but still limited to one hard-coded URL. Confirm Drive's `uc?export=download` path works and the interstitial handler kicks in if needed. Hash-compare against the previously-stored bytes to confirm incremental skip works.
- **Phase 3 — scrape + small batch.** Wire up `fetchPolicyIndex()` and process the **first N=3 documents** from the parsed list. Confirm topic/document grouping is correct in the DB and the catalog UI renders.
- **Phase 4 — full sync.** Remove the limit. Add the job table, fire-and-forget kickoff, and progress polling. Only at this point does the full ~100-doc loop actually run.

A simple feature gate to keep this honest: a `POLICY_SYNC_LIMIT` env var (or hard-coded constant in `lib/policy/sync.ts`) that caps the number of docs processed per sync. Default to `1` during phases 1–2, `3` for phase 3, and remove the cap for phase 4. This means the same sync code path is exercised throughout — we're not building two versions.

## Status (built 2026-05-29)

All code is implemented and verified end-to-end against the live LM Studio + Coolify Postgres. The phasing was achieved with a single code path gated by `POLICY_SYNC_LIMIT` rather than separate fixture phases — the real scrape+download path was correct on the first doc, so a disk fixture wasn't needed.

- ✅ Nav item (`lib/copy.ts`, `MdGavel`) — appears in both `HeaderNav` and `Sidebar` (both read `headerLinks`).
- ✅ Schema `lib/db/schema/policy.ts`: `policy_topics`, `policy_documents`, `policy_sections`, `policy_chunks` (vector(1024) + HNSW cosine index), `policy_sync_jobs`. Applied via `pnpm db:push` (the repo's DB has no migration journal, so `db:migrate` replays 0000 and fails — **use `db:push`**). Generated migration `0001_regular_riptide.sql` kept for record (note: it also drops a stale `projects` self-ref FK that the committed schema had already removed).
- ✅ Password gate `lib/policyServer.ts` (`verifyPolicyPassword` / `getPolicyPassword`, header `x-policy-password`).
- ✅ Helpers under `lib/policy/`: `constants.ts` (index URL, topic A–J map, `getSyncLimit`), `scrape.ts`, `download.ts` (Drive `uc?export=download` + confirm-interstitial handling; Docs `export?format=pdf`), `parse.ts` (unpdf extract + section split + chunk), `lmStudio.ts` (`embed`/`chat`/`toVectorLiteral`), `sync.ts` (`processPolicy`/`runSync`).
- ✅ API routes: `pages/api/policy/sync.ts` (GET=latest job, POST=start fire-and-forget), `documents.ts`, `search.ts` (pgvector `<=>` cosine + `ts_rank` FTS merge → RAG via chat model).
- ✅ Page `pages/policy/index.tsx` (DaisyUI to match `toxiproxyDelay.tsx`): password unlock, ask panel + citations (react-markdown), sync panel with progress polling + grouped catalog.
- ✅ Dependency added: `unpdf`.

**Verified:** wrong password → 401; one-doc sync (A.01) downloaded/parsed/embedded/stored; second sync reported `1 unchanged` (content-hash incremental skip); RAG search answered "who adopts policies" citing **A.01** with a source link, matchCount 4.

**To go full-corpus (Phase 4):** set `POLICY_SYNC_LIMIT=0` in `.env` (currently unset → default 1) and press Sync. ~149 links on the index; expect the first run to take a while (download + parse + embed each).

## Verification

1. `pnpm db:generate` then hand-edit the generated SQL to add `CREATE EXTENSION IF NOT EXISTS vector;` at the top, then `pnpm db:migrate`. Confirm tables and HNSW index exist with `pnpm db:studio`.
2. `pnpm dev` and open http://localhost:3000. The **Projects → NCSU Policy** entry should appear in the header dropdown.
3. Visit `/policy`, enter `POLICY_LLM_PASSWORD`, press **Sync**. Watch the status panel count up; total should match the link count on the source page (~100). Re-press Sync → it should complete in seconds with 0 new docs ("all up to date").
4. Modify a `content_hash` in the DB to a fake value and Sync again → that one doc should re-process (verify by checking its `last_synced_at` advanced and its chunks were replaced).
5. Ask: *"What is the policy on board member conflicts of interest?"* → answer should cite **B.04** and the citations list should link to its Drive URL. Try a non-policy question (*"What's the weather?"*) → model should decline.
6. Open DevTools → log out (clear `sessionStorage`) → page should re-prompt for password. Hit any `/api/policy/*` endpoint without the header → 401.
