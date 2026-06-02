import type { NextApiRequest, NextApiResponse } from 'next';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { policyQueries } from '@/lib/db/schema';
import { getPolicyPassword, verifyPolicyAdmin } from '@/lib/policyServer';

// Admin-only: list recent questions + answers for review.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = verifyPolicyAdmin(getPolicyPassword(req));
  if (!admin.ok) return res.status(admin.status).json({ error: admin.error });

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const queries = await db
    .select()
    .from(policyQueries)
    .orderBy(desc(policyQueries.createdAt))
    .limit(100);

  return res.status(200).json({ queries });
}
