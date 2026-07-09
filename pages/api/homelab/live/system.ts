import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchUnraidSystem, getHomelabKey, verifyHomelabAccess } from '@/lib/homelab/server';

// Live (non-persisted) Unraid system state — array capacity, disks, hardware.
// Fetched fresh on each call so the overview page can poll it. Credentials stay
// server-side; the browser only ever hits this authenticated route.
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

  const { data, error } = await fetchUnraidSystem();
  if (!data) return res.status(502).json({ error: error || 'Unraid unreachable' });

  return res.status(200).json({ system: data, error: error || null });
}
