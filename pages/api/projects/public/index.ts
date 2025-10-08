import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../lib/db';
import { projects, users } from '../../../../lib/db/schema';
import { eq, and, or, ilike, desc, asc } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      query = '', 
      sortBy = 'newest', 
      gridWidth, 
      gridHeight,
      limit = '20',
      offset = '0'
    } = req.query;

    // Build conditions
    const conditions = [eq(projects.isPublic, true)];

    if (query && typeof query === 'string') {
      conditions.push(
        or(
          ilike(projects.name, `%${query}%`),
          ilike(users.username, `%${query}%`)
        )!
      );
    }

    if (gridWidth && typeof gridWidth === 'string') {
      conditions.push(eq(projects.gridWidth, parseInt(gridWidth)));
    }

    if (gridHeight && typeof gridHeight === 'string') {
      conditions.push(eq(projects.gridHeight, parseInt(gridHeight)));
    }

    let queryBuilder = db
      .select({
        id: projects.id,
        name: projects.name,
        isPublic: projects.isPublic,
        gridData: projects.gridData,
        gridWidth: projects.gridWidth,
        gridHeight: projects.gridHeight,
        viewCount: projects.viewCount,
        duplicateCount: projects.duplicateCount,
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
      .where(and(...conditions));

    // Apply sorting and pagination
    const limitNum = Math.min(parseInt(limit as string) || 20, 50); // Max 50 items
    const offsetNum = parseInt(offset as string) || 0;

    let orderByClause;
    switch (sortBy) {
      case 'oldest':
        orderByClause = asc(projects.createdAt);
        break;
      case 'popular':
        orderByClause = desc(projects.viewCount);
        break;
      case 'newest':
      default:
        orderByClause = desc(projects.createdAt);
        break;
    }

    const publicProjects = await queryBuilder
      .orderBy(orderByClause)
      .limit(limitNum)
      .offset(offsetNum);

    return res.status(200).json(publicProjects);
  } catch (error) {
    console.error('Error fetching public projects:', error);
    return res.status(500).json({ error: 'Failed to fetch public projects' });
  }
}