import http from 'node:http';
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

async function unraidGraphQL(query: string): Promise<{
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
      body: JSON.stringify({ query }),
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

export function fetchUnraid() {
  return unraidGraphQL(UNRAID_QUERY);
}

// Lighter query for the live system panel — no docker/vms payload, just the
// bits whose values actually move between page refreshes (array capacity, disk
// temps/usage) plus static hardware info.
const UNRAID_SYSTEM_QUERY = `
{
  info {
    cpu { brand cores threads }
    memory { layout { size type clockSpeed } }
    os { distro hostname uptime }
  }
  array {
    state
    capacity { kilobytes { free total used } }
    parities { name size status }
    disks { name size status fsType fsFree fsSize temp }
    caches { name size fsType fsFree fsSize }
  }
}
`;

export function fetchUnraidSystem() {
  return unraidGraphQL(UNRAID_SYSTEM_QUERY);
}

// ---------------------------------------------------------------------------
// Uptime Kuma — Prometheus /metrics endpoint (HTTP Basic auth, API key as pw).
// ---------------------------------------------------------------------------

export type UptimeMonitor = {
  name: string;
  type: string | null;
  url: string | null;
  status: number; // 0 down, 1 up, 2 pending, 3 maintenance, -1 unknown
  responseTime: number | null; // ms
};

export async function fetchUptimeKuma(): Promise<{
  data: UptimeMonitor[] | null;
  error?: string;
}> {
  const host = process.env.HOMELAB_UPTIMEKUMA_HOST;
  const token = process.env.HOMELAB_UPTIMEKUMA_TOKEN;
  if (!host || !token) {
    return {
      data: null,
      error: 'HOMELAB_UPTIMEKUMA_HOST/TOKEN not configured',
    };
  }
  try {
    // Kuma's /metrics uses Basic auth with an empty username + the API key.
    const auth = Buffer.from(`:${token}`).toString('base64');
    const resp = await fetch(`http://${host}/metrics`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!resp.ok) {
      return { data: null, error: `Uptime Kuma /metrics HTTP ${resp.status}` };
    }
    const text = await resp.text();
    const byName = new Map<string, UptimeMonitor>();
    const parseLabels = (s: string): Record<string, string> => {
      const o: Record<string, string> = {};
      for (const m of Array.from(s.matchAll(/(\w+)="([^"]*)"/g))) o[m[1]] = m[2];
      return o;
    };
    for (const line of text.split('\n')) {
      if (!line || line.startsWith('#')) continue;
      const m = line.match(
        /^(monitor_status|monitor_response_time)\{([^}]*)\}\s+(.+)$/,
      );
      if (!m) continue;
      const [, metric, labelStr, valStr] = m;
      const labels = parseLabels(labelStr);
      const name = labels.monitor_name;
      if (!name) continue;
      let mon = byName.get(name);
      if (!mon) {
        mon = {
          name,
          type: labels.monitor_type || null,
          url:
            labels.monitor_url && labels.monitor_url !== 'null'
              ? labels.monitor_url
              : null,
          status: -1,
          responseTime: null,
        };
        byName.set(name, mon);
      }
      const val = Number(valStr);
      if (metric === 'monitor_status') {
        mon.status = Number.isNaN(val) ? -1 : val;
      } else if (metric === 'monitor_response_time') {
        mon.responseTime = Number.isNaN(val) ? null : val;
      }
    }
    return { data: Array.from(byName.values()) };
  } catch (e) {
    return {
      data: null,
      error: `Uptime Kuma fetch failed: ${(e as Error).message}`,
    };
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

  // Apps/services/databases only carry an `environment_id`, so fetch each
  // project's detail (which lists its environments) to build a map of
  // environment id -> project. Resources can then be grouped by project.
  const projects = Array.isArray(out.projects) ? out.projects : [];
  if (projects.length > 0) {
    const projectByEnv: Record<number, { name: string; uuid: string }> = {};
    await Promise.all(
      projects.map(async (p: any) => {
        if (!p?.uuid) return;
        try {
          const resp = await fetch(
            `http://${host}/api/v1/projects/${p.uuid}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (!resp.ok) {
            errs.push(`Coolify project ${p.uuid}: HTTP ${resp.status}`);
            return;
          }
          const detail = await resp.json();
          for (const env of detail.environments ?? []) {
            if (env?.id != null) {
              projectByEnv[env.id] = { name: p.name, uuid: p.uuid };
            }
          }
        } catch (e) {
          errs.push(`Coolify project ${p.uuid}: ${(e as Error).message}`);
        }
      }),
    );
    out.projectByEnv = projectByEnv;
  }

  return { data: out, error: errs.length ? errs.join('; ') : undefined };
}

// ---------------------------------------------------------------------------
// Caddy Admin API — reverse-proxy routes + live upstream health.
// ---------------------------------------------------------------------------

// Caddy's admin API rejects any request carrying an `Origin` header whose host
// isn't in its (default, loopback-only) allow-list. undici's global `fetch`
// always attaches an Origin, so it 403s; the raw node http client sends none
// (like curl), so we use it here — no server-side `admin { origins }` change
// needed.
function caddyAdminGet(
  host: string,
  path: string,
  timeoutMs = 8000,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const [hostname, portStr] = host.split(':');
    const req = http.request(
      {
        hostname,
        port: portStr ? Number(portStr) : 80,
        path,
        method: 'GET',
        timeout: timeoutMs,
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          const status = res.statusCode ?? 0;
          if (status >= 400) {
            reject(new Error(`HTTP ${status} for ${path}`));
            return;
          }
          try {
            resolve(body ? JSON.parse(body) : null);
          } catch {
            reject(new Error(`invalid JSON from ${path}`));
          }
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error(`timeout for ${path}`)));
    req.on('error', reject);
    req.end();
  });
}

export async function fetchCaddy(): Promise<{
  data: { config: any; upstreams: any[] } | null;
  error?: string;
}> {
  const host = process.env.HOMELAB_CADDY_HOST;
  if (!host) {
    return { data: null, error: 'HOMELAB_CADDY_HOST not configured' };
  }
  try {
    const config = await caddyAdminGet(host, '/config/');
    let upstreams: any[] = [];
    try {
      const u = await caddyAdminGet(host, '/reverse_proxy/upstreams');
      upstreams = Array.isArray(u) ? u : [];
    } catch {
      // upstream health is a nice-to-have; routes still map without it.
    }
    return { data: { config, upstreams } };
  } catch (e) {
    return { data: null, error: `Caddy fetch failed: ${(e as Error).message}` };
  }
}

// Recursively collect every reverse_proxy upstream dial reachable from a
// route's handler list (descending through subroutes).
function collectDials(handlers: any[] | undefined): string[] {
  const out: string[] = [];
  for (const h of handlers ?? []) {
    if (h?.handler === 'reverse_proxy') {
      for (const u of h.upstreams ?? []) if (u?.dial) out.push(u.dial);
    } else if (h?.handler === 'subroute') {
      for (const r of h.routes ?? []) out.push(...collectDials(r.handle));
    }
  }
  return out;
}

export type CaddyRoute = {
  host: string;
  upstream: string | null; // real (non-auth) backend dial, e.g. "10.0.0.50:5820"
  authProtected: boolean; // sits behind an Authentik forward-auth chain
  route: any;
};

// Extract one entry per public hostname from the Caddy config. srv0 (:443) and
// srv1 (:80) carry identical routes, so we dedupe by hostname (https first).
export function caddyRoutes(caddy: {
  config?: any;
} | null | undefined): CaddyRoute[] {
  const servers = caddy?.config?.apps?.http?.servers ?? {};
  const httpsRank = (s: any) =>
    (s?.listen ?? []).some((l: string) => l.includes(':443')) ? 1 : 0;
  const entries = Object.entries<any>(servers).sort(
    (a, b) => httpsRank(b[1]) - httpsRank(a[1]),
  );
  const seen = new Set<string>();
  const out: CaddyRoute[] = [];
  for (const [, srv] of entries) {
    for (const route of srv.routes ?? []) {
      const hosts: string[] = [];
      for (const m of route.match ?? []) if (m.host) hosts.push(...m.host);
      if (hosts.length === 0) continue; // skip catch-alls with no host
      const dials = collectDials(route.handle);
      const real = dials.filter((d) => !/authentik/i.test(d));
      const upstream = real[0] ?? dials[0] ?? null;
      const authProtected = dials.some((d) => /authentik/i.test(d)) && real.length > 0;
      for (const h of hosts) {
        if (seen.has(h)) continue;
        seen.add(h);
        out.push({ host: h, upstream, authProtected, route });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Glances — live per-host CPU/mem/load/temps + per-container resource usage.
// Supports both API v3 (older, e.g. Unraid) and v4 (newer, e.g. Coolify);
// version is auto-detected per host. Configure hosts as a comma-separated list.
// ---------------------------------------------------------------------------

export type GlancesContainer = {
  host: string;
  name: string;
  cpu: number | null; // percent
  mem: number | null; // bytes
  status: string | null;
};
export type GlancesHostData = {
  host: string;
  name: string; // display label: configured label > reported hostname > host
  hostname: string | null;
  cpuPercent: number | null;
  mem: { percent: number | null; used: number | null; total: number | null };
  load: { min1: number | null; cores: number | null };
  temps: { label: string; value: number }[];
  uptime: string | null;
  containers: GlancesContainer[];
  error?: string;
};

async function glancesJson(base: string, plugin: string): Promise<any> {
  const r = await fetch(`${base}/${plugin}`);
  if (!r.ok) throw new Error(`${plugin} HTTP ${r.status}`);
  return r.json();
}

async function fetchGlancesHost(
  host: string,
  label: string | null,
): Promise<GlancesHostData> {
  // Detect API version: v4 first, fall back to v3.
  let base = `http://${host}/api/4`;
  try {
    await glancesJson(base, 'cpu');
  } catch {
    base = `http://${host}/api/3`;
  }
  const [cpu, mem, load, sensors, system, uptime, cont] = await Promise.all([
    glancesJson(base, 'cpu').catch(() => null),
    glancesJson(base, 'mem').catch(() => null),
    glancesJson(base, 'load').catch(() => null),
    glancesJson(base, 'sensors').catch(() => []),
    glancesJson(base, 'system').catch(() => null),
    glancesJson(base, 'uptime').catch(() => null),
    glancesJson(base, 'containers').catch(() => null),
  ]);
  // Containerized Glances often reports a container-id hostname (e.g.
  // "b86c83eafc35"); treat that as unknown. Display priority: configured label
  // > reported hostname > the host:port itself.
  const rawHostname = system?.hostname ?? null;
  const hostname = rawHostname && /^[0-9a-f]{12}$/i.test(rawHostname) ? null : rawHostname;
  const name = label || hostname || host;

  // v3 wraps as { containers: [...] }; v4 returns a bare array.
  const list: any[] = Array.isArray(cont) ? cont : (cont?.containers ?? []);
  const isRunning = (s: unknown) => /^(running|up)/i.test(String(s ?? ''));
  const containers: GlancesContainer[] = list
    .map((c) => ({
      host: name,
      name: c.name ?? '?',
      cpu: typeof c.cpu_percent === 'number' ? c.cpu_percent : null,
      mem: typeof c.memory_usage === 'number' ? c.memory_usage : null,
      status: c.Status ?? c.status ?? null,
    }))
    .filter((c) => isRunning(c.status));
  const temps = Array.isArray(sensors)
    ? sensors
        .filter((s: any) => s?.unit === 'C' && typeof s.value === 'number')
        .map((s: any) => ({ label: String(s.label), value: s.value }))
    : [];
  return {
    host,
    name,
    hostname,
    cpuPercent: typeof cpu?.total === 'number' ? cpu.total : null,
    mem: {
      percent: mem?.percent ?? null,
      used: mem?.used ?? null,
      total: mem?.total ?? null,
    },
    load: { min1: load?.min1 ?? null, cores: load?.cpucore ?? null },
    temps,
    uptime: typeof uptime === 'string' ? uptime : null,
    containers,
  };
}

export async function fetchGlances(): Promise<{
  data: GlancesHostData[] | null;
  error?: string;
}> {
  const raw = process.env.HOMELAB_GLANCES_HOSTS;
  if (!raw) {
    return { data: null, error: 'HOMELAB_GLANCES_HOSTS not configured' };
  }
  // Each entry is "host:port" or "Label=host:port".
  const entries = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((e) => {
      const eq = e.indexOf('=');
      return eq > 0
        ? { label: e.slice(0, eq).trim(), host: e.slice(eq + 1).trim() }
        : { label: null as string | null, host: e };
    });
  const data = await Promise.all(
    entries.map(async ({ host: h, label }): Promise<GlancesHostData> => {
      try {
        return await fetchGlancesHost(h, label);
      } catch (e) {
        return {
          host: h,
          name: label || h,
          hostname: null,
          cpuPercent: null,
          mem: { percent: null, used: null, total: null },
          load: { min1: null, cores: null },
          temps: [],
          uptime: null,
          containers: [],
          error: (e as Error).message,
        };
      }
    }),
  );
  return { data };
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

// Coolify stores published ports as a comma-separated list of "host:container"
// pairs (optionally "host:container/proto"), e.g. "7878:7777, 8443:443/udp".
type PortMapping = { host: number; container: number | null; proto: string };
function parsePortMappings(raw: unknown): PortMapping[] {
  if (typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const [hostPart, rest] = pair.split(':');
      let containerPart = rest ?? hostPart; // "3000" alone => host===container
      let proto = 'tcp';
      if (containerPart.includes('/')) {
        [containerPart, proto] = containerPart.split('/');
      }
      const host = parseInt(hostPart, 10);
      const container = parseInt(containerPart, 10);
      return {
        host,
        container: Number.isNaN(container) ? null : container,
        proto: proto || 'tcp',
      };
    })
    .filter((m) => !Number.isNaN(m.host));
}

// "7777, 7878" => [7777, 7878]
function parseExposes(raw: unknown): number[] {
  if (typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n));
}

function flatten(
  snapshotId: string,
  unraid: any,
  coolify: any,
  caddy: { config?: any; upstreams?: any[] } | null,
): NewHomelabResource[] {
  const rows: NewHomelabResource[] = [];
  const uIp = unraidIp();
  const cIp = coolifyIp();

  // Resolve a Coolify resource's project name from its environment_id; falls
  // back to a flat 'coolify' when the mapping isn't available.
  const projectByEnv: Record<number, { name: string; uuid: string }> =
    coolify?.projectByEnv ?? {};
  const coolifyStack = (envId: unknown): string => {
    const p = typeof envId === 'number' ? projectByEnv[envId] : undefined;
    return p?.name || 'coolify';
  };

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

  // Coolify applications — reachable via their published host port(s) on the
  // Coolify host, plus the reverse-proxy FQDN. Emit one row per port mapping;
  // only fall back to the FQDN's 80/443 when an app publishes no host port.
  const apps: any[] = coolify?.applications ?? [];
  for (const a of apps) {
    const fqdn: string = a.fqdn ?? '';
    const mappings = parsePortMappings(a.ports_mappings);
    const exposes = parseExposes(a.ports_exposes);
    const base = {
      snapshotId,
      source: 'coolify-app' as const,
      kind: 'application' as const,
      name: a.name ?? a.uuid ?? '?',
      hostIp: cIp,
      url: null,
      state: a.status ?? null,
      stack: coolifyStack(a.environment_id),
      image: null,
      // Keep Coolify's public FQDN for reference even though we link locally.
      tags: fqdn ? { fqdn } : null,
      raw: a,
    };
    if (mappings.length > 0) {
      for (const m of mappings) {
        rows.push({
          ...base,
          port: m.host,
          internalPort: m.container ?? exposes[0] ?? null,
          protocol: m.proto.toUpperCase(),
          // Reachable directly on the Coolify host at the published port.
          url: `http://${cIp}:${m.host}`,
        });
      }
    } else {
      // No host port published — only reachable through the reverse-proxy FQDN.
      const isHttps = fqdn.startsWith('https://');
      rows.push({
        ...base,
        port: isHttps ? 443 : 80,
        internalPort: exposes[0] ?? null,
        protocol: 'TCP',
        url: fqdn || null,
      });
    }
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
      stack: coolifyStack(s.environment_id),
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
      stack: coolifyStack(d.environment_id),
      image: d.database_type ?? null,
      tags: null,
      raw: d,
    });
  }

  // Caddy reverse-proxy routes — one row per public hostname, pointing at the
  // real (non-auth) upstream backend, annotated with live traffic + auth flag.
  const upstreamStats = new Map<string, { requests: number; fails: number }>();
  for (const u of caddy?.upstreams ?? []) {
    if (u?.address) {
      upstreamStats.set(u.address, {
        requests: u.num_requests ?? 0,
        fails: u.fails ?? 0,
      });
    }
  }
  for (const r of caddyRoutes(caddy)) {
    const dial = r.upstream;
    let backendIp: string | null = null;
    let backendPort: number | null = null;
    if (dial) {
      const i = dial.lastIndexOf(':');
      backendIp = i >= 0 ? dial.slice(0, i) : dial;
      const p = i >= 0 ? parseInt(dial.slice(i + 1), 10) : NaN;
      backendPort = Number.isNaN(p) ? null : p;
    }
    const stat = dial ? upstreamStats.get(dial) : undefined;
    rows.push({
      snapshotId,
      source: 'caddy',
      kind: 'route',
      name: r.host,
      hostIp: backendIp,
      port: backendPort,
      internalPort: null,
      protocol: 'HTTPS',
      url: `https://${r.host}`,
      // In the pool => Caddy is actively serving it. Auth-gated flagged too.
      state: dial ? (stat ? 'up' : 'configured') : null,
      stack: 'caddy',
      image: null,
      tags: {
        upstream: dial,
        authProtected: r.authProtected,
        requests: stat?.requests ?? null,
        fails: stat?.fails ?? null,
      },
      raw: r.route,
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
    caddyRoutes: number;
    resources: number;
  };
  error?: string;
}> {
  const [unraid, coolify, caddy] = await Promise.all([
    fetchUnraid(),
    fetchCoolify(),
    fetchCaddy(),
  ]);
  const errs = [unraid.error, coolify.error, caddy.error]
    .filter(Boolean)
    .join('; ');

  const containerCount = unraid.data?.docker?.containers?.length ?? 0;
  const vmCount = unraid.data?.vms?.domains?.length ?? 0;
  const coolifyAppCount = coolify.data?.applications?.length ?? 0;
  const coolifyServiceCount = coolify.data?.services?.length ?? 0;
  const coolifyDbCount = coolify.data?.databases?.length ?? 0;
  const caddyRouteCount = caddyRoutes(caddy.data).length;

  const [snap] = await db
    .insert(homelabSnapshots)
    .values({
      status: errs ? 'partial' : 'ok',
      containerCount,
      vmCount,
      coolifyAppCount,
      coolifyServiceCount,
      coolifyDbCount,
      caddyRouteCount,
      errors: errs || null,
      rawUnraid: unraid.data,
      rawCoolify: coolify.data,
      rawCaddy: caddy.data,
    })
    .returning({ id: homelabSnapshots.id });

  const rows = flatten(snap.id, unraid.data, coolify.data, caddy.data);
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
      caddyRoutes: caddyRouteCount,
      resources: rows.length,
    },
    error: errs || undefined,
  };
}
