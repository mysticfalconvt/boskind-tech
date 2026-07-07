import type { NextApiRequest } from 'next';
import { db } from '@/lib/db';
import {
  homelabSnapshots,
  homelabResources,
  type NewHomelabResource,
} from '@/lib/db/schema';

export type AccessCheck =
  | { ok: true }
  | { ok: false; status: number; error: string };

export function verifyHomelabAccess(
  provided: string | undefined | null,
): AccessCheck {
  const expected = process.env.HOMELAB_ACCESS_KEY;
  if (!expected) {
    return {
      ok: false,
      status: 503,
      error: 'HOMELAB_ACCESS_KEY is not configured on the server',
    };
  }
  if (!provided || provided !== expected) {
    return { ok: false, status: 401, error: 'Invalid access key' };
  }
  return { ok: true };
}

export function getHomelabKey(req: NextApiRequest): string | undefined {
  const header = req.headers['x-homelab-key'];
  if (Array.isArray(header)) return header[0];
  return header;
}

// ---------------------------------------------------------------------------
// Unraid GraphQL
// ---------------------------------------------------------------------------

const UNRAID_QUERY = `
{
  info {
    cpu { manufacturer brand cores threads speedmax socket }
    memory { layout { size type clockSpeed manufacturer } }
    baseboard { manufacturer model version memSlots memMax }
    os { platform distro release kernel arch hostname uptime }
    system { manufacturer model version virtual }
  }
  vars { name version timeZone }
  array {
    state
    capacity { kilobytes { free total used } disks { free total used } }
    parities { name device size status }
    disks { idx name device size status fsType fsFree fsSize temp rotational }
    caches { name device size fsType fsFree fsSize }
    boot { name device size }
  }
  docker {
    containers {
      names image state status autoStart webUiUrl labels
      ports { ip privatePort publicPort type }
    }
  }
  vms { domains { name state } }
}
`;

export async function fetchUnraid(): Promise<{
  data: any;
  error?: string;
}> {
  const host = process.env.HOMELAB_UNRAID_HOST;
  const key = process.env.HOMELAB_UNRAID_API_KEY;
  if (!host || !key) {
    return { data: null, error: 'HOMELAB_UNRAID_HOST/API_KEY not configured' };
  }
  const url = `http://${host}/graphql`;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
      },
      body: JSON.stringify({ query: UNRAID_QUERY }),
    });
    if (!resp.ok) {
      return { data: null, error: `Unraid ${resp.status} ${resp.statusText}` };
    }
    const body = await resp.json();
    if (body.errors) {
      return {
        data: body.data ?? null,
        error: body.errors.map((e: any) => e.message).join('; '),
      };
    }
    return { data: body.data };
  } catch (e) {
    return { data: null, error: `Unraid fetch failed: ${(e as Error).message}` };
  }
}

// ---------------------------------------------------------------------------
// Coolify REST
// ---------------------------------------------------------------------------

const COOLIFY_PATHS = [
  ['version', '/api/v1/version'],
  ['servers', '/api/v1/servers'],
  ['applications', '/api/v1/applications'],
  ['services', '/api/v1/services'],
  ['databases', '/api/v1/databases'],
  ['projects', '/api/v1/projects'],
] as const;

export async function fetchCoolify(): Promise<{
  data: Record<string, any>;
  error?: string;
}> {
  const host = process.env.HOMELAB_COOLIFY_HOST;
  const token = process.env.HOMELAB_COOLIFY_TOKEN;
  if (!host || !token) {
    return {
      data: {},
      error: 'HOMELAB_COOLIFY_HOST/TOKEN not configured',
    };
  }
  const out: Record<string, any> = {};
  const errs: string[] = [];
  await Promise.all(
    COOLIFY_PATHS.map(async ([key, path]) => {
      try {
        const resp = await fetch(`http://${host}${path}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) {
          errs.push(`Coolify ${path}: HTTP ${resp.status}`);
          out[key] = null;
          return;
        }
        out[key] =
          key === 'version'
            ? (await resp.text()).trim()
            : await resp.json();
      } catch (e) {
        errs.push(`Coolify ${path}: ${(e as Error).message}`);
        out[key] = null;
      }
    }),
  );
  return { data: out, error: errs.length ? errs.join('; ') : undefined };
}

// ---------------------------------------------------------------------------
// Flatten a snapshot's raw data into homelab_resources rows.
// ---------------------------------------------------------------------------

function unraidIp(): string {
  const host = process.env.HOMELAB_UNRAID_HOST || '10.0.0.50';
  return host.split(':')[0];
}
function coolifyIp(): string {
  const host = process.env.HOMELAB_COOLIFY_HOST || '10.0.0.23:8000';
  return host.split(':')[0];
}

function flatten(
  snapshotId: string,
  unraid: any,
  coolify: any,
): NewHomelabResource[] {
  const rows: NewHomelabResource[] = [];
  const uIp = unraidIp();
  const cIp = coolifyIp();

  // Unraid Docker containers — one row per publicly-exposed port, plus a
  // row-with-no-port for containers that don't publish anything (still useful
  // for the "what's running" view).
  const containers = unraid?.docker?.containers ?? [];
  for (const c of containers) {
    const name = (c.names?.[0] ?? '?').replace(/^\//, '');
    const labels = c.labels ?? {};
    const stack: string | null =
      labels['com.docker.compose.project'] ?? null;
    const state = c.state ?? null;
    const web: string = c.webUiUrl ?? '';
    const pubPorts = (c.ports ?? []).filter(
      (p: any) => p.publicPort != null,
    );
    if (pubPorts.length === 0) {
      rows.push({
        snapshotId,
        source: 'unraid-docker',
        kind: 'container',
        name,
        hostIp: uIp,
        port: null,
        internalPort: null,
        protocol: null,
        url: web || null,
        state,
        stack,
        image: c.image ?? null,
        tags: null,
        raw: c,
      });
      continue;
    }
    for (const p of pubPorts) {
      const port = p.publicPort;
      const proto = (p.type ?? 'tcp').toUpperCase();
      // Attach webUiUrl only to the port that appears in the URL.
      const matchUrl = web && web.includes(`:${port}`) ? web : null;
      rows.push({
        snapshotId,
        source: 'unraid-docker',
        kind: 'container',
        name,
        hostIp: uIp,
        port,
        internalPort: p.privatePort ?? null,
        protocol: proto,
        url: matchUrl,
        state,
        stack,
        image: c.image ?? null,
        tags: null,
        raw: c,
      });
    }
  }

  // Unraid VMs — one row per VM (no port info available from the API).
  const vms = unraid?.vms?.domains ?? [];
  for (const v of vms) {
    rows.push({
      snapshotId,
      source: 'unraid-vm',
      kind: 'vm',
      name: v.name,
      hostIp: uIp,
      port: null,
      internalPort: null,
      protocol: null,
      url: null,
      state: v.state ?? null,
      stack: null,
      image: null,
      tags: null,
      raw: v,
    });
  }

  // Coolify applications — public FQDNs on the Coolify host.
  const apps: any[] = coolify?.applications ?? [];
  for (const a of apps) {
    const fqdn: string = a.fqdn ?? '';
    const isHttps = fqdn.startsWith('https://');
    rows.push({
      snapshotId,
      source: 'coolify-app',
      kind: 'application',
      name: a.name ?? a.uuid ?? '?',
      hostIp: cIp,
      port: isHttps ? 443 : 80,
      internalPort: null,
      protocol: 'TCP',
      url: fqdn || null,
      state: a.status ?? null,
      stack: 'coolify',
      image: null,
      tags: null,
      raw: a,
    });
  }

  // Coolify one-shot services (Glances, beszel, etc.).
  const services: any[] = coolify?.services ?? [];
  for (const s of services) {
    rows.push({
      snapshotId,
      source: 'coolify-service',
      kind: 'service',
      name: s.name ?? s.uuid ?? '?',
      hostIp: cIp,
      port: null,
      internalPort: null,
      protocol: null,
      url: s.fqdn ?? null,
      state: s.status ?? null,
      stack: 'coolify',
      image: s.service_type ?? null,
      tags: null,
      raw: s,
    });
  }

  // Coolify databases — one row per DB (public_port may be null).
  const databases: any[] = coolify?.databases ?? [];
  for (const d of databases) {
    const pp: number | null = d.public_port ?? null;
    rows.push({
      snapshotId,
      source: 'coolify-db',
      kind: 'database',
      name: d.name ?? d.uuid ?? '?',
      hostIp: cIp,
      port: pp,
      internalPort: null,
      protocol: pp ? 'TCP' : null,
      url: pp ? `postgres://${cIp}:${pp}` : null,
      state: d.status ?? null,
      stack: 'coolify',
      image: d.database_type ?? null,
      tags: null,
      raw: d,
    });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Take a snapshot — query both APIs, insert into DB in a single transaction.
// ---------------------------------------------------------------------------

export async function takeSnapshot(): Promise<{
  snapshotId: string;
  counts: {
    containers: number;
    vms: number;
    coolifyApps: number;
    coolifyServices: number;
    coolifyDbs: number;
    resources: number;
  };
  error?: string;
}> {
  const [unraid, coolify] = await Promise.all([fetchUnraid(), fetchCoolify()]);
  const errs = [unraid.error, coolify.error].filter(Boolean).join('; ');

  const containerCount = unraid.data?.docker?.containers?.length ?? 0;
  const vmCount = unraid.data?.vms?.domains?.length ?? 0;
  const coolifyAppCount = coolify.data?.applications?.length ?? 0;
  const coolifyServiceCount = coolify.data?.services?.length ?? 0;
  const coolifyDbCount = coolify.data?.databases?.length ?? 0;

  const [snap] = await db
    .insert(homelabSnapshots)
    .values({
      status: errs ? 'partial' : 'ok',
      containerCount,
      vmCount,
      coolifyAppCount,
      coolifyServiceCount,
      coolifyDbCount,
      errors: errs || null,
      rawUnraid: unraid.data,
      rawCoolify: coolify.data,
    })
    .returning({ id: homelabSnapshots.id });

  const rows = flatten(snap.id, unraid.data, coolify.data);
  if (rows.length > 0) {
    await db.insert(homelabResources).values(rows);
  }

  return {
    snapshotId: snap.id,
    counts: {
      containers: containerCount,
      vms: vmCount,
      coolifyApps: coolifyAppCount,
      coolifyServices: coolifyServiceCount,
      coolifyDbs: coolifyDbCount,
      resources: rows.length,
    },
    error: errs || undefined,
  };
}
