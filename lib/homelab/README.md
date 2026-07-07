# Homelab dashboard

Env-key-gated view of the homelab, powered by snapshots of the Unraid GraphQL
API and Coolify REST API. Data lives in the same Postgres database as the rest
of boskind-tech (see `POSTGRES_URL`).

## Pages

Unlinked from the marketing nav — you have to know the URL.

- `/homelab/login` — enter the access key. Stores it in `localStorage`.
- `/homelab` — dashboard. Snapshot history, "Snapshot Now" button, summary stats.
- `/homelab/services` — searchable table of every resource in the latest snapshot.
- `/homelab/ports` — port map per host + "find free ports in range" tool.
- `/homelab/stacks` — resources grouped by compose project / Coolify project.

Once the stored key validates against the server, a `Homelab` link appears
under `Projects` in the main nav (both header + mobile sidebar).

## API

All routes require the `x-homelab-key` header. 503 when the env var is unset
(fail-closed), 401 on a wrong key.

- `GET  /api/homelab/check` — 200 if the key validates, otherwise 401/503.
- `POST /api/homelab/snapshot` — queries Unraid + Coolify, writes a new
  snapshot + resources to the DB, returns counts.
- `GET  /api/homelab/snapshots` — snapshot history (metadata only, no raw
  payloads).
- `GET  /api/homelab/resources?q=&host=&kind=&snapshotId=` — search the
  flattened resources of one snapshot (defaults to the latest).
- `GET  /api/homelab/ports?host=&rangeLo=&rangeHi=` — port map for the latest
  snapshot, plus optional free-in-range calc when all three params are given.

## Environment variables

All server-side; never sent to the browser.

| var                       | required | example                          | purpose                                                       |
|---------------------------|----------|----------------------------------|---------------------------------------------------------------|
| `HOMELAB_ACCESS_KEY`      | yes      | `openssl rand -hex 32`           | Gates every `/homelab/*` and `/api/homelab/*` request.        |
| `HOMELAB_UNRAID_HOST`     | yes      | `10.0.0.50`                      | Unraid host (no scheme). Path `/graphql` is fixed.            |
| `HOMELAB_UNRAID_API_KEY`  | yes      | `a10cdf…`                        | Read-scope API key from Unraid's `Settings → Management Access → API`. |
| `HOMELAB_COOLIFY_HOST`    | yes      | `10.0.0.23:8000`                 | Coolify host **including port**. Note: 8000, not 80.          |
| `HOMELAB_COOLIFY_TOKEN`   | yes      | `1\|bJY…`                        | Coolify → Keys & Tokens → API token (read is enough).         |

## DB migration

Two new tables (`homelab_snapshots`, `homelab_resources`). Generate + apply
the migration with the existing scripts:

```bash
pnpm db:generate
pnpm db:migrate
```

Both are cascade-deleted together — dropping a snapshot drops its resources.

## Data model

- `homelab_snapshots` — one row per run. Keeps the raw Unraid + Coolify
  payloads in `jsonb` columns so the flattener can be re-run without hitting
  the APIs again.
- `homelab_resources` — flattened for search. One row per exposed port for
  Docker containers (a container publishing 5 ports produces 5 rows) plus one
  row each for VMs, Coolify apps, services, and databases. Indexed on
  `(host_ip, port)`, `name`, and `stack`.

## Adding a source

Bolt-on new inputs by:

1. Add fetch + flatten logic in `lib/homelab/server.ts`.
2. Include its raw output in the snapshot's `rawUnraid`/`rawCoolify` (or add a
   new column if you want to store it separately).
3. Emit `NewHomelabResource` rows from `flatten()`.

The UI is agnostic — any row with a `hostIp` + `port` will show up on the
ports page and any row will show up on the search page.
