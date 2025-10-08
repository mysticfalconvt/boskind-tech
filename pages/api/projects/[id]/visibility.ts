import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/auth/utils';
import { db } from '../../../../lib/db';
import { projects } from '../../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';

async function handler(req: NextApiRequest, res: NextApiResponse, session: any) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const userId = session.user.id;
  const { isPublic } = req.body;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  if (typeof isPublic !== 'boolean') {
    return res.status(400).json({ error: 'isPublic must be a boolean' });
  }

  try {
    // Verify project ownership
    const existingProject = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .limit(1);

    if (existingProject.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updatedProject = await db
      .update(projects)
      .set({ 
        isPublic,
        updatedAt: new Date()
      })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();

    return res.status(200).json(updatedProject[0]);
  } catch (error) {
    console.error('Error updating project visibility:', error);
    return res.status(500).json({ error: 'Failed to update project visibility' });
  }
}

export default withAuth(handler);