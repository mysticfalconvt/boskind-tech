import type { NextApiRequest, NextApiResponse } from 'next';
import {
  BANDWIDTH_TOXIC_NAME,
  getToxiproxyServerConfig,
  readProxyState,
  toxiproxyRequest,
  verifyToxiproxyPassword,
} from '@/lib/toxiproxyServer';

function getPassword(req: NextApiRequest): string | undefined {
  const header = req.headers['x-toxiproxy-password'];
  if (Array.isArray(header)) return header[0];
  return header;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { apiBase } = getToxiproxyServerConfig();

  try {
    if (req.method === 'POST') {
      const auth = verifyToxiproxyPassword(getPassword(req));
      if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

      const body = (req.body ?? {}) as { proxy?: unknown; rate?: unknown };
      const proxy = typeof body.proxy === 'string' ? body.proxy : '';
      const rate = Number(body.rate);
      if (!proxy) {
        return res.status(400).json({ error: 'Missing proxy name' });
      }
      if (!Number.isFinite(rate) || rate < 0) {
        return res.status(400).json({ error: 'Invalid bandwidth rate (KB/s)' });
      }

      const encProxy = encodeURIComponent(proxy);
      const encToxic = encodeURIComponent(BANDWIDTH_TOXIC_NAME);
      await toxiproxyRequest(`/proxies/${encProxy}/toxics/${encToxic}`, {
        method: 'DELETE',
      }).catch(() => undefined);

      const createRes = await toxiproxyRequest(`/proxies/${encProxy}/toxics`, {
        method: 'POST',
        body: JSON.stringify({
          name: BANDWIDTH_TOXIC_NAME,
          type: 'bandwidth',
          stream: 'downstream',
          attributes: { rate },
        }),
      });
      const raw = await createRes.text();
      if (!createRes.ok) {
        throw new Error(raw || createRes.statusText || `HTTP ${createRes.status}`);
      }
      const state = await readProxyState(proxy);
      return res.status(200).json({ state });
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
        `/proxies/${encProxy}/toxics/${encodeURIComponent(BANDWIDTH_TOXIC_NAME)}`,
        { method: 'DELETE' },
      );
      if (!delRes.ok && delRes.status !== 404) {
        const t = await delRes.text();
        throw new Error(t || delRes.statusText || `HTTP ${delRes.status}`);
      }
      const state = await readProxyState(proxy);
      return res.status(200).json({ cleared: true, state });
    }

    res.setHeader('Allow', 'POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(502).json({
      error: message,
      hint: `Check Toxiproxy is reachable at ${apiBase}.`,
    });
  }
}
