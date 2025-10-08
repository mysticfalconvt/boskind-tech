import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../db';
import { users, sessions } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function getServerSession(req: NextApiRequest, res: NextApiResponse) {
  try {
    let sessionId: string | null = null;

    // First try to get session from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionId = authHeader.replace('Bearer ', '');
    } else {
      // Fallback to cookie
      const cookies = req.headers.cookie;
      if (cookies) {
        const sessionMatch = cookies.match(/session=([^;]+)/);
        if (sessionMatch) {
          sessionId = sessionMatch[1];
        }
      }
    }

    if (!sessionId) {
      return null;
    }

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
      return null;
    }

    return { user: sessionData[0].user };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export function withAuth(handler: (req: NextApiRequest, res: NextApiResponse, session: any) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res);
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    return handler(req, res, session);
  };
}

export function validateUsername(username: string): string | null {
  if (!username || username.length < 3) {
    return 'Username must be at least 3 characters long';
  }
  if (username.length > 50) {
    return 'Username must be less than 50 characters';
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return 'Username can only contain letters, numbers, underscores, and hyphens';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  if (password.length > 255) {
    return 'Password must be less than 255 characters';
  }
  return null;
}