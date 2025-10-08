import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';
import { users, sessions } from '../../../lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try to get session from Authorization header (sent from client)
    const authHeader = req.headers.authorization;
    console.log('Auth me - authorization header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth me - no authorization header found');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const sessionId = authHeader.replace('Bearer ', '');
    console.log('Auth me - session ID from header:', sessionId);

    // Find valid session
    const sessionData = await db
      .select({
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
        user: {
          id: users.id,
          username: users.username,
          createdAt: users.createdAt,
        }
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(
        eq(sessions.id, sessionId),
        gt(sessions.expiresAt, new Date())
      ))
      .limit(1);

    if (sessionData.length === 0) {
      return res.status(401).json({ error: 'Session expired' });
    }

    return res.status(200).json({ 
      user: sessionData[0].user
    });
  } catch (error) {
    console.error('Session error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}