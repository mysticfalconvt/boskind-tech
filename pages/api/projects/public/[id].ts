import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../lib/db';
import { projects, users } from '../../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  try {
    const publicProject = await db
      .select({
        id: projects.id,
        name: projects.name,
        isPublic: projects.isPublic,
        gridData: projects.gridData,
        gridWidth: projects.gridWidth,
        gridHeight: projects.gridHeight,
        viewCount: projects.viewCount,
        duplicateCount: projects.duplicateCount,
        originalProjectId: projects.originalProjectId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        creator: {
          id: users.id,
          username: users.username,
          createdAt: users.createdAt,
        }
      })
      .from(projects)
      .innerJoin(users, eq(projects.userId, users.id))
      .where(and(eq(projects.id, id), eq(projects.isPublic, true)))
      .limit(1);

    if (publicProject.length === 0) {
      return res.status(404).json({ error: 'Public project not found' });
    }

    // Increment view count
    await db
      .update(projects)
      .set({ 
        viewCount: publicProject[0].viewCount + 1,
        updatedAt: new Date()
      })
      .where(eq(projects.id, id));

    // Return the project with incremented view count
    const result = {
      ...publicProject[0],
      viewCount: publicProject[0].viewCount + 1
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching public project:', error);
    return res.status(500).json({ error: 'Failed to fetch public project' });
  }
}