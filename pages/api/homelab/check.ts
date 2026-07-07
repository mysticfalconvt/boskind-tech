import type { NextApiRequest, NextApiResponse } from 'next';
import { getHomelabKey, verifyHomelabAccess } from '@/lib/homelab/server';

// Cheap auth ping. The UI calls this on mount to decide whether to show the
// /homelab link in the nav.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const access = verifyHomelabAccess(getHomelabKey(req));
  if (!access.ok) return res.status(access.status).json({ error: access.error });
  return res.status(200).json({ ok: true });
}
