import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';
import { sessions } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get session from cookie
    const cookies = req.headers.cookie;
    if (cookies) {
      const sessionMatch = cookies.match(/session=([^;]+)/);
      if (sessionMatch) {
        const sessionId = sessionMatch[1];
        
        // Delete session from database
        await db.delete(sessions).where(eq(sessions.id, sessionId));
      }
    }

    // Clear session cookie
    const cookie = serialize('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });
    
    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}