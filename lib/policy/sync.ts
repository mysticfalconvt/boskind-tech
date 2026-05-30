import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  policyTopics,
  policyDocuments,
  policySections,
  policyChunks,
} from '@/lib/db/schema';
import { fetchPolicyIndex, ScrapedPolicy } from './scrape';
import { downloadPolicyPdf } from './download';
import {
  extractPdfText,
  splitIntoSections,
  splitIntoChunks,
  approxTokens,
} from './parse';
import { embed } from './lmStudio';
import { getSyncLimit, TOPIC_NAMES } from './constants';

const EMBED_BATCH = 12;

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

// Delete all indexed policy data (chunks -> sections -> documents -> topics).
// Used by the dev-only "Wipe & Sync" action to start from a clean slate, e.g.
// after changing the chunking strategy. Does not touch policy_sync_jobs.
export async function wipePolicyData(): Promise<void> {
  await db.delete(policyChunks);
  await db.delete(policySections);
  await db.delete(policyDocuments);
  await db.delete(policyTopics);
}

function topicOrdinal(code: string): number {
  const letter = code?.[0] ?? '?';
  const idx = Object.keys(TOPIC_NAMES).indexOf(letter);
  return idx === -1 ? 99 : idx;
}

async function upsertTopic(p: ScrapedPolicy): Promise<string | null> {
  if (!p.topicCode || p.topicCode === '?') return null;
  const rows = await db
    .insert(policyTopics)
    .values({
      code: p.topicCode,
      name: p.topicName,
      ordinal: topicOrdinal(p.topicCode),
    })
    .onConflictDoUpdate({
      target: policyTopics.code,
      set: { name: p.topicName, updatedAt: new Date() },
    })
    .returning({ id: policyTopics.id });
  return rows[0]?.id ?? null;
}

// Embed an arbitrary list of texts in batches.
async function embedAll(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH);
    const vecs = await embed(batch);
    out.push(...vecs);
  }
  return out;
}

type ChunkPlan = {
  kind: 'title' | 'heading' | 'body';
  content: string;
  sectionOrdinal: number | null;
};

// Build the list of chunks (title, section headings, body slices) for a doc.
function planChunks(
  title: string,
  sections: ReturnType<typeof splitIntoSections>,
): ChunkPlan[] {
  const plan: ChunkPlan[] = [];
  if (title.trim()) {
    plan.push({ kind: 'title', content: title.trim(), sectionOrdinal: null });
  }
  for (const s of sections) {
    if (s.heading && s.heading.trim()) {
      plan.push({
        kind: 'heading',
        content: s.heading.trim(),
        sectionOrdinal: s.ordinal,
      });
    }
    for (const body of splitIntoChunks(s.content)) {
      plan.push({ kind: 'body', content: body, sectionOrdinal: s.ordinal });
    }
  }
  return plan;
}

export type DocResult = {
  policyCode: string | null;
  title: string;
  sourceUrl: string;
  status: 'indexed' | 'skipped' | 'error';
  ms: number;
  chunks: number;
  embedTokens: number;
  message?: string;
};

// Process a single scraped policy: download, hash, and (if changed) parse +
// embed + store. Returns a per-document result.
export async function processPolicy(p: ScrapedPolicy): Promise<DocResult> {
  const startedAt = Date.now();
  const base: DocResult = {
    policyCode: p.policyCode,
    title: p.title,
    sourceUrl: p.sourceUrl,
    status: 'indexed',
    ms: 0,
    chunks: 0,
    embedTokens: 0,
  };
  try {
    const topicId = await upsertTopic(p);

    const existing = await db
      .select()
      .from(policyDocuments)
      .where(eq(policyDocuments.sourceUrl, p.sourceUrl))
      .limit(1);
    const prior = existing[0];

    const { bytes, downloadUrl } = await downloadPolicyPdf(p.sourceUrl);
    const hash = sha256(bytes);

    // Incremental: unchanged file -> only refresh metadata, skip re-parse.
    if (prior && prior.contentHash === hash) {
      await db
        .update(policyDocuments)
        .set({
          topicId,
          policyCode: p.policyCode,
          title: p.title,
          downloadUrl,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(policyDocuments.id, prior.id));
      return { ...base, status: 'skipped', ms: Date.now() - startedAt };
    }

    const text = await extractPdfText(bytes);
    const sections = splitIntoSections(text);
    const plan = planChunks(p.title, sections);
    const embedTokens = plan.reduce((sum, c) => sum + approxTokens(c.content), 0);
    const embeddings = await embedAll(plan.map((c) => c.content));

    // Content is new or changed -> bump the update counter and stamp the
    // content-changed time (prior.updateCount is 0/undefined for a new doc).
    const now = new Date();
    const updateCount = (prior?.updateCount ?? 0) + 1;

    // Upsert the document row.
    const docRows = await db
      .insert(policyDocuments)
      .values({
        topicId,
        policyCode: p.policyCode,
        title: p.title,
        sourceUrl: p.sourceUrl,
        downloadUrl,
        contentHash: hash,
        parsedText: text,
        embedTokens,
        updateCount,
        contentUpdatedAt: now,
        lastSyncedAt: now,
      })
      .onConflictDoUpdate({
        target: policyDocuments.sourceUrl,
        set: {
          topicId,
          policyCode: p.policyCode,
          title: p.title,
          downloadUrl,
          contentHash: hash,
          parsedText: text,
          embedTokens,
          updateCount,
          contentUpdatedAt: now,
          lastSyncedAt: now,
          updatedAt: now,
        },
      })
      .returning({ id: policyDocuments.id });
    const documentId = docRows[0].id;

    // Replace prior sections/chunks for this document.
    await db.delete(policyChunks).where(eq(policyChunks.documentId, documentId));
    await db
      .delete(policySections)
      .where(eq(policySections.documentId, documentId));

    // Insert sections, mapping ordinal -> new id.
    const ordinalToSectionId = new Map<number, string>();
    for (const s of sections) {
      const rows = await db
        .insert(policySections)
        .values({
          documentId,
          ordinal: s.ordinal,
          heading: s.heading,
          content: s.content,
        })
        .returning({ id: policySections.id });
      ordinalToSectionId.set(s.ordinal, rows[0].id);
    }

    // Insert chunks with their embeddings.
    if (plan.length > 0) {
      const values = plan.map((c, i) => ({
        documentId,
        sectionId:
          c.sectionOrdinal != null
            ? ordinalToSectionId.get(c.sectionOrdinal) ?? null
            : null,
        kind: c.kind,
        content: c.content,
        embedding: embeddings[i],
      }));
      // Insert in batches to keep statements reasonable.
      for (let i = 0; i < values.length; i += 100) {
        await db.insert(policyChunks).values(values.slice(i, i + 100));
      }
    }

    return {
      ...base,
      chunks: plan.length,
      embedTokens,
      ms: Date.now() - startedAt,
    };
  } catch (e) {
    return {
      ...base,
      status: 'error',
      ms: Date.now() - startedAt,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export type SyncProgress = {
  total: number;
  completed: number;
  skipped: number;
  errors: number;
  chunksCreated: number;
  embedTokens: number;
};

// Run a full sync. `onProgress` is called after each document so a caller can
// persist progress to the job row. Honors POLICY_SYNC_LIMIT.
export async function runSync(
  onProgress?: (p: SyncProgress, last: DocResult) => Promise<void> | void,
): Promise<{ results: DocResult[]; progress: SyncProgress }> {
  const all = await fetchPolicyIndex();
  const limit = getSyncLimit();
  const list = limit > 0 ? all.slice(0, limit) : all;

  const progress: SyncProgress = {
    total: list.length,
    completed: 0,
    skipped: 0,
    errors: 0,
    chunksCreated: 0,
    embedTokens: 0,
  };
  const results: DocResult[] = [];

  for (const p of list) {
    const result = await processPolicy(p);
    results.push(result);
    progress.completed += 1;
    if (result.status === 'skipped') progress.skipped += 1;
    if (result.status === 'error') progress.errors += 1;
    progress.chunksCreated += result.chunks;
    progress.embedTokens += result.embedTokens;
    if (onProgress) await onProgress({ ...progress }, result);
  }

  return { results, progress };
}
