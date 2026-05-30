import type { NextApiRequest, NextApiResponse } from 'next';
import { getPolicyPassword, verifyPolicyAccess } from '@/lib/policyServer';

// Validates the entered password and reports the resulting role so the client
// can decide whether to show the sync controls.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const access = verifyPolicyAccess(getPolicyPassword(req));
  if (!access.ok) return res.status(access.status).json({ error: access.error });
  return res.status(200).json({ ok: true, role: access.role });
}
