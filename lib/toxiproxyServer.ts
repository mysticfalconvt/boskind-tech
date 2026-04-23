const DEFAULT_API = 'http://localhost:8474';
const DEFAULT_PROXY = 'slowmysql';
const DEFAULT_TOXIC_NAME = 'latency';

const UPSTREAM_UA = 'boskind-tech-toxiproxy-client/1';

export type ToxiproxyServerConfig = {
  apiBase: string;
  proxy: string;
  toxicName: string;
};

export function getToxiproxyServerConfig(): ToxiproxyServerConfig {
  const apiBase = (
    process.env.TOXIPROXY_API || DEFAULT_API
  ).replace(/\/$/, '');
  const proxy = process.env.TOXIPROXY_PROXY || DEFAULT_PROXY;
  const toxicName = process.env.TOXIPROXY_TOXIC_NAME || DEFAULT_TOXIC_NAME;
  return { apiBase, proxy, toxicName };
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
