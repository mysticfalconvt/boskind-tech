import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchUptimeKuma, getHomelabKey, verifyHomelabAccess } from '@/lib/homelab/server';

// Live (non-persisted) Uptime Kuma monitor status, polled by the overview page.
// The Kuma API key stays server-side; the browser only hits this auth'd route.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const access = verifyHomelabAccess(getHomelabKey(req));
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data, error } = await fetchUptimeKuma();
  if (!data) return res.status(502).json({ error: error || 'Uptime Kuma unreachable' });

  return res.status(200).json({ monitors: data, error: error || null });
}
