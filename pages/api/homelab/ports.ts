import type { NextApiRequest, NextApiResponse } from 'next';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { homelabResources, homelabSnapshots } from '@/lib/db/schema';
import { getHomelabKey, verifyHomelabAccess } from '@/lib/homelab/server';

type PortRow = {
  host: string;
  port: number;
  protocol: string;
  names: string[];
};

// GET /api/homelab/ports
//   ?host=<ip>              filter to one host
//   ?rangeLo=&rangeHi=       compute free ports in the range (inclusive)
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

  const [latest] = await db
    .select({ id: homelabSnapshots.id, takenAt: homelabSnapshots.takenAt })
    .from(homelabSnapshots)
    .orderBy(desc(homelabSnapshots.takenAt))
    .limit(1);
  if (!latest) {
    return res
      .status(200)
      .json({ snapshotId: null, takenAt: null, byHost: {}, freeInRange: null });
  }

  const hostFilter = typeof req.query.host === 'string' ? req.query.host : null;
  const conditions = [
    eq(homelabResources.snapshotId, latest.id),
    isNotNull(homelabResources.port),
  ];
  if (hostFilter) conditions.push(eq(homelabResources.hostIp, hostFilter));

  const rows = await db
    .select({
      host: homelabResources.hostIp,
      port: homelabResources.port,
      protocol: homelabResources.protocol,
      name: homelabResources.name,
    })
    .from(homelabResources)
    .where(and(...conditions))
    .orderBy(homelabResources.hostIp, homelabResources.port);

  // Group ports by (host, port, protocol) so services sharing a port on the
  // same host collapse to one row.
  const grouped = new Map<string, PortRow>();
  for (const r of rows) {
    if (!r.host || r.port == null) continue;
    const key = `${r.host}|${r.port}|${r.protocol ?? 'TCP'}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.names.push(r.name);
    } else {
      grouped.set(key, {
        host: r.host,
        port: r.port,
        protocol: r.protocol ?? 'TCP',
        names: [r.name],
      });
    }
  }

  const byHost: Record<string, PortRow[]> = {};
  grouped.forEach((row) => {
    (byHost[row.host] ??= []).push(row);
  });
  for (const list of Object.values(byHost)) list.sort((a, b) => a.port - b.port);

  // Free-ports-in-range calc.
  let freeInRange: { host: string; lo: number; hi: number; free: number[] } | null =
    null;
  const lo = Number(req.query.rangeLo);
  const hi = Number(req.query.rangeHi);
  if (
    hostFilter &&
    Number.isFinite(lo) &&
    Number.isFinite(hi) &&
    lo >= 1 &&
    hi >= lo &&
    hi <= 65535 &&
    hi - lo <= 5000
  ) {
    const used = new Set(
      (byHost[hostFilter] ?? []).map((r) => r.port),
    );
    const free: number[] = [];
    for (let p = lo; p <= hi; p++) if (!used.has(p)) free.push(p);
    freeInRange = { host: hostFilter, lo, hi, free };
  }

  return res.status(200).json({
    snapshotId: latest.id,
    takenAt: latest.takenAt,
    byHost,
    freeInRange,
  });
}
