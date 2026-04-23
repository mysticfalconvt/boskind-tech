const DEFAULT_API = 'http://localhost:8474';
const DEFAULT_TOXIC_NAME = 'latency';
export const BANDWIDTH_TOXIC_NAME = 'bandwidth';

const UPSTREAM_UA = 'boskind-tech-toxiproxy-client/1';

export type ToxiproxyServerConfig = {
  apiBase: string;
  toxicName: string;
};

export function getToxiproxyServerConfig(): ToxiproxyServerConfig {
  const apiBase = (
    process.env.TOXIPROXY_API || DEFAULT_API
  ).replace(/\/$/, '');
  const toxicName = process.env.TOXIPROXY_TOXIC_NAME || DEFAULT_TOXIC_NAME;
  return { apiBase, toxicName };
}

type ToxicJson = {
  name: string;
  type: string;
  stream: string;
  toxicity: number;
  attributes: Record<string, number>;
};

export type ProxyWithToxicsJson = {
  name: string;
  enabled: boolean;
  listen: string;
  upstream: string;
  toxics: ToxicJson[];
};

export type ProxyState = {
  proxy: string;
  toxicName: string;
  enabled: boolean;
  listen: string;
  upstream: string;
  latencyMs: number | null;
  jitterMs: number | null;
  bandwidthKbps: number | null;
};

export async function toxiproxyRequest(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const { apiBase } = getToxiproxyServerConfig();
  const url = `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(init?.headers);
  if (!headers.has('User-Agent')) {
    headers.set('User-Agent', UPSTREAM_UA);
  }
  if (
    init?.method &&
    init.method !== 'GET' &&
    init.method !== 'HEAD' &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(url, { ...init, headers });
}

export function findLatencyToxic(
  toxics: ToxicJson[],
  toxicName: string,
): ToxicJson | undefined {
  const byName = toxics.find((t) => t.name === toxicName && t.type === 'latency');
  if (byName) return byName;
  return toxics.find((t) => t.type === 'latency');
}

export function findBandwidthToxic(
  toxics: ToxicJson[],
): ToxicJson | undefined {
  const byName = toxics.find(
    (t) => t.name === BANDWIDTH_TOXIC_NAME && t.type === 'bandwidth',
  );
  if (byName) return byName;
  return toxics.find((t) => t.type === 'bandwidth');
}

function toProxyState(data: ProxyWithToxicsJson, toxicName: string): ProxyState {
  const toxic = findLatencyToxic(data.toxics ?? [], toxicName);
  const bandwidth = findBandwidthToxic(data.toxics ?? []);
  const latency = toxic?.attributes?.latency;
  const jitter = toxic?.attributes?.jitter;
  const rate = bandwidth?.attributes?.rate;
  return {
    proxy: data.name,
    toxicName,
    enabled: data.enabled,
    listen: data.listen,
    upstream: data.upstream,
    latencyMs: typeof latency === 'number' ? latency : null,
    jitterMs: typeof jitter === 'number' ? jitter : null,
    bandwidthKbps: typeof rate === 'number' ? rate : null,
  };
}

export async function readProxyState(proxyName: string): Promise<ProxyState> {
  const { toxicName } = getToxiproxyServerConfig();
  const res = await toxiproxyRequest(`/proxies/${encodeURIComponent(proxyName)}`);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || res.statusText || `HTTP ${res.status}`);
  }
  let data: ProxyWithToxicsJson;
  try {
    data = JSON.parse(text) as ProxyWithToxicsJson;
  } catch {
    throw new Error('Invalid JSON from Toxiproxy');
  }
  return toProxyState(data, toxicName);
}

export async function listAllProxyStates(): Promise<ProxyState[]> {
  const { toxicName } = getToxiproxyServerConfig();
  const res = await toxiproxyRequest('/proxies');
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || res.statusText || `HTTP ${res.status}`);
  }
  let data: Record<string, ProxyWithToxicsJson>;
  try {
    data = JSON.parse(text) as Record<string, ProxyWithToxicsJson>;
  } catch {
    throw new Error('Invalid JSON from Toxiproxy');
  }
  return Object.values(data)
    .map((p) => toProxyState(p, toxicName))
    .sort((a, b) => a.proxy.localeCompare(b.proxy));
}

export type PasswordCheck =
  | { ok: true }
  | { ok: false; status: number; error: string };

export function verifyToxiproxyPassword(
  provided: string | undefined | null,
): PasswordCheck {
  const expected = process.env.TOXIPROXY_PASSWORD;
  if (!expected) {
    return {
      ok: false,
      status: 503,
      error: 'TOXIPROXY_PASSWORD is not configured on the server',
    };
  }
  if (!provided || provided !== expected) {
    return { ok: false, status: 401, error: 'Invalid password' };
  }
  return { ok: true };
}
