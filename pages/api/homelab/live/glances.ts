import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchGlances, getHomelabKey, verifyHomelabAccess } from '@/lib/homelab/server';

// Live (non-persisted) per-host resource usage + per-container CPU/mem from
// Glances. Polled by the overview page. Hosts configured server-side.
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

  const { data, error } = await fetchGlances();
  if (!data) return res.status(502).json({ error: error || 'Glances unreachable' });

  return res.status(200).json({ hosts: data, error: error || null });
}
