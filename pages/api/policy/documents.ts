import type { NextApiRequest, NextApiResponse } from 'next';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  policyChunks,
  policyDocuments,
  policySections,
  policyTopics,
} from '@/lib/db/schema';
import { getPolicyPassword, verifyPolicyAccess } from '@/lib/policyServer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const auth = verifyPolicyAccess(getPolicyPassword(req));
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rows = await db
    .select({
      id: policyDocuments.id,
      policyCode: policyDocuments.policyCode,
      title: policyDocuments.title,
      sourceUrl: policyDocuments.sourceUrl,
      lastSyncedAt: policyDocuments.lastSyncedAt,
      embedTokens: policyDocuments.embedTokens,
      updateCount: policyDocuments.updateCount,
      contentUpdatedAt: policyDocuments.contentUpdatedAt,
      topicCode: policyTopics.code,
      topicName: policyTopics.name,
      topicOrdinal: policyTopics.ordinal,
    })
    .from(policyDocuments)
    .leftJoin(policyTopics, eq(policyDocuments.topicId, policyTopics.id))
    .orderBy(asc(policyDocuments.policyCode));

  // Per-document chunk and section counts, merged in by document id.
  const chunkCounts = await db
    .select({
      documentId: policyChunks.documentId,
      n: sql<number>`count(*)::int`,
    })
    .from(policyChunks)
    .groupBy(policyChunks.documentId);
  const sectionCounts = await db
    .select({
      documentId: policySections.documentId,
      n: sql<number>`count(*)::int`,
    })
    .from(policySections)
    .groupBy(policySections.documentId);
  const chunkByDoc = new Map(chunkCounts.map((c) => [c.documentId, c.n]));
  const sectionByDoc = new Map(sectionCounts.map((s) => [s.documentId, s.n]));

  const withCounts = rows.map((r) => ({
    ...r,
    chunkCount: chunkByDoc.get(r.id) ?? 0,
    sectionCount: sectionByDoc.get(r.id) ?? 0,
  }));

  type Row = (typeof withCounts)[number];

  // Group by topic for the UI.
  const byTopic = new Map<
    string,
    { topicCode: string; topicName: string; ordinal: number; documents: Row[] }
  >();
  for (const r of withCounts) {
    const key = r.topicCode ?? 'OTHER';
    if (!byTopic.has(key)) {
      byTopic.set(key, {
        topicCode: r.topicCode ?? 'OTHER',
        topicName: r.topicName ?? 'Other',
        ordinal: r.topicOrdinal ?? 99,
        documents: [],
      });
    }
    byTopic.get(key)!.documents.push(r);
  }
  const topics = Array.from(byTopic.values()).sort(
    (a, b) => a.ordinal - b.ordinal,
  );

  return res.status(200).json({ count: rows.length, topics });
}
