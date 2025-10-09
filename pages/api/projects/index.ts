import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/auth/utils';
import { db } from '../../../lib/db';
import { projects } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';

async function handler(req: NextApiRequest, res: NextApiResponse, session: unknown) {
  const userId = session.user.id;

  if (req.method === 'GET') {
    try {
      const userProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(projects.updatedAt);
      return res.status(200).json(userProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, gridData, gridWidth = 29, gridHeight = 29 } = req.body;

      if (!name || !gridData) {
        return res.status(400).json({ error: 'Name and grid data are required' });
      }

      if (name.length > 100) {
        return res.status(400).json({ error: 'Project name must be less than 100 characters' });
      }

      const newProject = await db
        .insert(projects)
        .values({
          userId,
          name,
          gridData,
          gridWidth,
          gridHeight,
          isPublic: false,
        })
        .returning();

      return res.status(201).json(newProject[0]);
    } catch (error) {
      console.error('Error creating project:', error);
      return res.status(500).json({ error: 'Failed to create project' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);