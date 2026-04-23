import type { NextApiRequest, NextApiResponse } from 'next';
import {
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
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const auth = verifyToxiproxyPassword(getPassword(req));
    if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

    const body = (req.body ?? {}) as { proxy?: unknown; enabled?: unknown };
    const proxy = typeof body.proxy === 'string' ? body.proxy : '';
    const enabled = body.enabled;
    if (!proxy) {
      return res.status(400).json({ error: 'Missing proxy name' });
    }
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Missing or invalid enabled flag' });
    }

    const encProxy = encodeURIComponent(proxy);
    const updateRes = await toxiproxyRequest(`/proxies/${encProxy}`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
    if (!updateRes.ok) {
      const t = await updateRes.text();
      throw new Error(t || updateRes.statusText || `HTTP ${updateRes.status}`);
    }
    const state = await readProxyState(proxy);
    return res.status(200).json({ state });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(502).json({
      error: message,
      hint: `Check Toxiproxy is reachable at ${apiBase}.`,
    });
  }
}
