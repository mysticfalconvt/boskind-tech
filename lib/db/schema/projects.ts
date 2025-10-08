import { pgTable, uuid, varchar, json, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  isPublic: boolean('is_public').notNull().default(false),
  gridData: json('grid_data').notNull(),
  gridWidth: integer('grid_width').notNull().default(29),
  gridHeight: integer('grid_height').notNull().default(29),
  viewCount: integer('view_count').notNull().default(0),
  duplicateCount: integer('duplicate_count').notNull().default(0),
  originalProjectId: uuid('original_project_id'), // Removed self-reference for now
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;