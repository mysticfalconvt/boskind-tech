import type { NextApiRequest, NextApiResponse } from 'next';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { homelabResources, homelabSnapshots } from '@/lib/db/schema';
import { getHomelabKey, verifyHomelabAccess } from '@/lib/homelab/server';

// GET /api/homelab/resources
//   ?q=<string>        matches name / stack / image / url (ILIKE %q%)
//   ?host=<ip>
//   ?kind=<kind>
//   ?snapshotId=<id>   default: latest snapshot
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

  const { q, host, kind, snapshotId: snapshotIdParam } = req.query;

  let snapshotId = typeof snapshotIdParam === 'string' ? snapshotIdParam : null;
  if (!snapshotId) {
    const [latest] = await db
      .select({ id: homelabSnapshots.id })
      .from(homelabSnapshots)
      .orderBy(desc(homelabSnapshots.takenAt))
      .limit(1);
    if (!latest) return res.status(200).json({ snapshotId: null, resources: [] });
    snapshotId = latest.id;
  }

  const conditions = [eq(homelabResources.snapshotId, snapshotId)];
  if (typeof host === 'string' && host)
    conditions.push(eq(homelabResources.hostIp, host));
  if (typeof kind === 'string' && kind)
    conditions.push(eq(homelabResources.kind, kind));
  if (typeof q === 'string' && q) {
    const like = `%${q}%`;
    conditions.push(
      or(
        ilike(homelabResources.name, like),
        ilike(homelabResources.stack, like),
        ilike(homelabResources.image, like),
        ilike(homelabResources.url, like),
      )!,
    );
  }

  const rows = await db
    .select({
      id: homelabResources.id,
      source: homelabResources.source,
      kind: homelabResources.kind,
      name: homelabResources.name,
      hostIp: homelabResources.hostIp,
      port: homelabResources.port,
      internalPort: homelabResources.internalPort,
      protocol: homelabResources.protocol,
      url: homelabResources.url,
      state: homelabResources.state,
      stack: homelabResources.stack,
      image: homelabResources.image,
      tags: homelabResources.tags,
    })
    .from(homelabResources)
    .where(and(...conditions))
    .orderBy(homelabResources.hostIp, homelabResources.port, homelabResources.name);

  return res.status(200).json({ snapshotId, resources: rows });
}
