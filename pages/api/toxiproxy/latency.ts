import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getToxiproxyServerConfig,
  listAllProxyStates,
  readProxyState,
  toxiproxyRequest,
  verifyToxiproxyPassword,
} from '@/lib/toxiproxyServer';

function getPassword(req: NextApiRequest): string | undefined {
  const header = req.headers['x-toxiproxy-password'];
  if (Array.isArray(header)) return header[0];
  return header;
}

function apiHostFromBase(apiBase: string): string | null {
  try {
    return new URL(apiBase).host;
  } catch {
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { apiBase, toxicName } = getToxiproxyServerConfig();
  const apiHost = apiHostFromBase(apiBase);

  try {
    if (req.method === 'GET') {
      const proxies = await listAllProxyStates();
      return res.status(200).json({ proxies, toxicName, apiHost });
    }

    if (req.method === 'POST') {
      const auth = verifyToxiproxyPassword(getPassword(req));
      if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

      const body = (req.body ?? {}) as {
        proxy?: unknown;
        latency?: unknown;
        jitter?: unknown;
      };
      const proxy = typeof body.proxy === 'string' ? body.proxy : '';
      const latency = Number(body.latency);
      const jitter = Number(body.jitter ?? 0);
      if (!proxy) {
        return res.status(400).json({ error: 'Missing proxy name' });
      }
      if (!Number.isFinite(latency) || latency < 0) {
        return res.status(400).json({ error: 'Invalid latency (ms)' });
      }
      if (!Number.isFinite(jitter) || jitter < 0) {
        return res.status(400).json({ error: 'Invalid jitter (ms)' });
      }

      const encProxy = encodeURIComponent(proxy);
      const encToxic = encodeURIComponent(toxicName);
      await toxiproxyRequest(`/proxies/${encProxy}/toxics/${encToxic}`, {
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
      const state = await readProxyState(proxy);
      return res.status(200).json({ toxic, state });
    }

    if (req.method === 'DELETE') {
      const auth = verifyToxiproxyPassword(getPassword(req));
      if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

      const rawProxy = req.query.proxy;
      const proxy = Array.isArray(rawProxy) ? rawProxy[0] : rawProxy;
      if (!proxy) {
        return res.status(400).json({ error: 'Missing proxy name' });
      }

      const encProxy = encodeURIComponent(proxy);
      const delRes = await toxiproxyRequest(
        `/proxies/${encProxy}/toxics/${encodeURIComponent(toxicName)}`,
        { method: 'DELETE' },
      );
      if (!delRes.ok && delRes.status !== 404) {
        const t = await delRes.text();
        throw new Error(t || delRes.statusText || `HTTP ${delRes.status}`);
      }
      const state = await readProxyState(proxy);
      return res.status(200).json({ cleared: true, state });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(502).json({
      error: message,
      hint:
        'Check TOXIPROXY_API in .env. Toxiproxy must be reachable from this Next.js server.',
    });
  }
}
