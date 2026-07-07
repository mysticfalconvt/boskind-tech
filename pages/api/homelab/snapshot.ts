import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getHomelabKey,
  takeSnapshot,
  verifyHomelabAccess,
} from '@/lib/homelab/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const access = verifyHomelabAccess(getHomelabKey(req));
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await takeSnapshot();
    return res.status(200).json(result);
  } catch (e) {
    return res
      .status(500)
      .json({ error: `Snapshot failed: ${(e as Error).message}` });
  }
}

export const config = {
  api: {
    // Snapshots can pull a lot of data (80+ containers with labels+ports).
    responseLimit: false,
    bodyParser: { sizeLimit: '1mb' },
  },
};
