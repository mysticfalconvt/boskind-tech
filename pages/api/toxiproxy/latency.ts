import type { NextApiRequest, NextApiResponse } from 'next';
import {
  findLatencyToxic,
  getToxiproxyServerConfig,
  toxiproxyRequest,
  type ProxyWithToxicsJson,
} from '@/lib/toxiproxyServer';

type GetResponse = {
  proxy: string;
  toxicName: string;
  enabled: boolean;
  listen: string;
  upstream: string;
  latencyMs: number | null;
  jitterMs: number | null;
  apiHost: string | null;
};

async function readProxyState(): Promise<GetResponse> {
  const { proxy, toxicName, apiBase } = getToxiproxyServerConfig();
  const res = await toxiproxyRequest(`/proxies/${encodeURIComponent(proxy)}`);
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
  const toxic = findLatencyToxic(data.toxics ?? [], toxicName);
  const latency = toxic?.attributes?.latency;
  const jitter = toxic?.attributes?.jitter;
  let apiHost: string | null = null;
  try {
    apiHost = new URL(apiBase).host;
  } catch {
    apiHost = null;
  }
  return {
    proxy: data.name,
    toxicName,
    enabled: data.enabled,
    listen: data.listen,
    upstream: data.upstream,
    latencyMs: typeof latency === 'number' ? latency : null,
    jitterMs: typeof jitter === 'number' ? jitter : null,
    apiHost,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { proxy, toxicName } = getToxiproxyServerConfig();

  try {
    if (req.method === 'GET') {
      const state = await readProxyState();
      return res.status(200).json(state);
    }

    if (req.method === 'POST') {
      const latency = Number(
        (req.body as { latency?: unknown })?.latency ??
          req.query.latency,
      );
      const jitter = Number(
        (req.body as { jitter?: unknown })?.jitter ??
          req.query.jitter ??
          0,
      );
      if (!Number.isFinite(latency) || latency < 0) {
        return res.status(400).json({ error: 'Invalid latency (ms)' });
      }
      if (!Number.isFinite(jitter) || jitter < 0) {
        return res.status(400).json({ error: 'Invalid jitter (ms)' });
      }

      const encProxy = encodeURIComponent(proxy);
      await toxiproxyRequest(`/proxies/${encProxy}/toxics/${encodeURIComponent(toxicName)}`, {
        method: 'DELETE',
      }).catch(() => undefined);

      const createRes = await toxiproxyRequest(`/proxies/${encProxy}/toxics`, {
        method: 'POST',
        body: JSON.stringify({
          name: toxicName,
          type: 'latency',
          stream: 'downstream',
          attributes: { latency, jitter },
        }),
      });
      const raw = await createRes.text();
      if (!createRes.ok) {
        throw new Error(raw || createRes.statusText || `HTTP ${createRes.status}`);
      }
      let toxic: unknown = null;
      if (raw) {
        try {
          toxic = JSON.parse(raw) as unknown;
        } catch {
          toxic = { raw };
        }
      }
      const state = await readProxyState();
      return res.status(200).json({
        toxic,
        state,
      });
    }

    if (req.method === 'DELETE') {
      const encProxy = encodeURIComponent(proxy);
      const delRes = await toxiproxyRequest(
        `/proxies/${encProxy}/toxics/${encodeURIComponent(toxicName)}`,
        { method: 'DELETE' },
      );
      if (!delRes.ok && delRes.status !== 404) {
        const t = await delRes.text();
        throw new Error(t || delRes.statusText || `HTTP ${delRes.status}`);
      }
      const state = await readProxyState();
      return res.status(200).json({ cleared: true, state });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(502).json({
      error: message,
      hint:
        'Check TOXIPROXY_API and TOXIPROXY_PROXY in .env.local. Toxiproxy must be reachable from this Next.js server.',
    });
  }
}
