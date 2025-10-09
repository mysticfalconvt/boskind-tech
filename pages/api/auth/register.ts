import { NextApiRequest, NextApiResponse } from 'next';
import { validateUsername, validatePassword } from '../../../lib/auth/utils';
import { db } from '../../../lib/db';
import { users, sessions } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Validate input
    const usernameError = validateUsername(username);
    if (usernameError) {
      return res.status(400).json({ error: usernameError });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    // Check if username already exists (case-insensitive)
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user (store username in lowercase)
    const newUser = await db
      .insert(users)
      .values({
        username: username.toLowerCase(),
        passwordHash,
      })
      .returning();

    // Create session (auto-login after registration)
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(sessions).values({
      id: sessionId,
      userId: newUser[0].id,
      expiresAt,
    });

    // Set session cookie using cookie library
    const cookie = serialize('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });
    
    console.log('Register - setting cookie:', cookie);
    res.setHeader('Set-Cookie', cookie);

    return res.status(201).json({ 
      success: true, 
      user: { 
        id: newUser[0].id, 
        username: newUser[0].username,
        createdAt: newUser[0].createdAt
      } 
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}