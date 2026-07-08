import type { NextApiRequest, NextApiResponse } from 'next';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { homelabSnapshots } from '@/lib/db/schema';
import { getHomelabKey, verifyHomelabAccess } from '@/lib/homelab/server';

// List snapshot metadata only (never the raw payloads — those can be large).
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

  const rows = await db
    .select({
      id: homelabSnapshots.id,
      takenAt: homelabSnapshots.takenAt,
      status: homelabSnapshots.status,
      containerCount: homelabSnapshots.containerCount,
      vmCount: homelabSnapshots.vmCount,
      coolifyAppCount: homelabSnapshots.coolifyAppCount,
      coolifyServiceCount: homelabSnapshots.coolifyServiceCount,
      coolifyDbCount: homelabSnapshots.coolifyDbCount,
      caddyRouteCount: homelabSnapshots.caddyRouteCount,
      errors: homelabSnapshots.errors,
    })
    .from(homelabSnapshots)
    .orderBy(desc(homelabSnapshots.takenAt))
    .limit(50);

  return res.status(200).json({ snapshots: rows });
}
