import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/auth/utils';
import { db } from '../../../../lib/db';
import { projects, users } from '../../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';

async function handler(req: NextApiRequest, res: NextApiResponse, session: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const userId = session.user.id;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  try {
    // Get the public project to duplicate
    const sourceProject = await db
      .select({
        id: projects.id,
        name: projects.name,
        gridData: projects.gridData,
        gridWidth: projects.gridWidth,
        gridHeight: projects.gridHeight,
        duplicateCount: projects.duplicateCount,
        creator: {
          username: users.username,
        }
      })
      .from(projects)
      .innerJoin(users, eq(projects.userId, users.id))
      .where(and(eq(projects.id, id), eq(projects.isPublic, true)))
      .limit(1);

    if (sourceProject.length === 0) {
      return res.status(404).json({ error: 'Public project not found' });
    }

    const source = sourceProject[0];

    // Create the duplicated project
    const duplicatedProject = await db
      .insert(projects)
      .values({
        userId,
        name: `${source.name} (Copy)`,
        gridData: source.gridData,
        gridWidth: source.gridWidth,
        gridHeight: source.gridHeight,
        isPublic: false, // Duplicated projects are private by default
        originalProjectId: source.id,
      })
      .returning();

    // Increment duplicate count on the original project
    await db
      .update(projects)
      .set({ 
        duplicateCount: source.duplicateCount + 1,
        updatedAt: new Date()
      })
      .where(eq(projects.id, id));

    return res.status(201).json({
      ...duplicatedProject[0],
      originalCreator: source.creator.username
    });
  } catch (error) {
    console.error('Error duplicating project:', error);
    return res.status(500).json({ error: 'Failed to duplicate project' });
  }
}

export default withAuth(handler);