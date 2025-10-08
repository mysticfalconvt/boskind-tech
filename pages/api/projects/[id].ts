import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/auth/utils';
import { db } from '../../../lib/db';
import { projects } from '../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';

async function handler(req: NextApiRequest, res: NextApiResponse, session: any) {
  const { id } = req.query;
  const userId = session.user.id;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  if (req.method === 'PUT') {
    try {
      const { name, gridData, gridWidth, gridHeight, isPublic } = req.body;

      // Verify project ownership
      const existingProject = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .limit(1);

      if (existingProject.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const updateData: any = { updatedAt: new Date() };
      
      if (name !== undefined) {
        if (name.length > 100) {
          return res.status(400).json({ error: 'Project name must be less than 100 characters' });
        }
        updateData.name = name;
      }
      
      if (gridData !== undefined) updateData.gridData = gridData;
      if (gridWidth !== undefined) updateData.gridWidth = gridWidth;
      if (gridHeight !== undefined) updateData.gridHeight = gridHeight;
      if (isPublic !== undefined) updateData.isPublic = isPublic;

      const updatedProject = await db
        .update(projects)
        .set(updateData)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .returning();

      return res.status(200).json(updatedProject[0]);
    } catch (error) {
      console.error('Error updating project:', error);
      return res.status(500).json({ error: 'Failed to update project' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const deletedProject = await db
        .delete(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .returning();

      if (deletedProject.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting project:', error);
      return res.status(500).json({ error: 'Failed to delete project' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);