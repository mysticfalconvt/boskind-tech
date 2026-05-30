import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  vector,
  index,
  json,
} from 'drizzle-orm/pg-core';

// The lettered sections on the NCSU policy index (A FOUNDATIONS, B BOARD
// GOVERNANCE, ... J HEALTH).
export const policyTopics = pgTable('policy_topics', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 8 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  ordinal: integer('ordinal').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// One row per PDF/Doc link on the index. We do NOT store the file bytes; the
// content_hash (sha256 of the downloaded bytes) drives incremental sync and
// parsed_text holds the extracted text. source_url is shown to the user so
// they can open the original document.
export const policyDocuments = pgTable(
  'policy_documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    topicId: uuid('topic_id').references(() => policyTopics.id),
    policyCode: varchar('policy_code', { length: 32 }),
    title: text('title').notNull(),
    sourceUrl: text('source_url').notNull().unique(),
    downloadUrl: text('download_url'),
    contentHash: varchar('content_hash', { length: 64 }),
    parsedText: text('parsed_text'),
    // Approx tokens embedded for this document's chunks (~chars/4), persisted
    // so the per-document breakdown can show it for every doc, not just the
    // last run.
    embedTokens: integer('embed_tokens').notNull().default(0),
    // How many times the document's content has actually changed + been
    // re-indexed (1 on first index), and when that last happened. Distinct
    // from lastSyncedAt, which advances on every sync even when unchanged.
    updateCount: integer('update_count').notNull().default(0),
    contentUpdatedAt: timestamp('content_updated_at'),
    lastSyncedAt: timestamp('last_synced_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    topicIdx: index('policy_documents_topic_idx').on(table.topicId),
  }),
);

// Best-effort section headings discovered while parsing a document.
export const policySections = pgTable(
  'policy_sections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => policyDocuments.id, { onDelete: 'cascade' }),
    ordinal: integer('ordinal').notNull().default(0),
    heading: text('heading'),
    content: text('content'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    documentIdx: index('policy_sections_document_idx').on(table.documentId),
  }),
);

// Embedded units used at search time. A chunk is either the document title, a
// section heading, or a slice of body text. embedding is a 1024-dim vector
// (mxbai-embed-large-v1) indexed with HNSW + cosine distance.
export const policyChunks = pgTable(
  'policy_chunks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => policyDocuments.id, { onDelete: 'cascade' }),
    sectionId: uuid('section_id').references(() => policySections.id, {
      onDelete: 'cascade',
    }),
    kind: varchar('kind', { length: 16 }).notNull(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1024 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    documentIdx: index('policy_chunks_document_idx').on(table.documentId),
    embeddingIdx: index('policy_chunks_embedding_idx').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops'),
    ),
  }),
);

// Tracks the state of a sync run so the UI can poll progress. We keep the most
// recent row and read its status/counters.
export type SyncDocDetail = {
  policyCode: string | null;
  title: string;
  sourceUrl: string;
  status: 'indexed' | 'skipped' | 'error';
  ms: number; // wall-clock time spent on this document
  chunks: number; // chunks created (0 for skipped)
  embedTokens: number; // approx tokens embedded (~chars/4)
  error?: string;
};

export const policySyncJobs = pgTable('policy_sync_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  status: varchar('status', { length: 16 }).notNull().default('running'),
  total: integer('total').notNull().default(0),
  completed: integer('completed').notNull().default(0),
  skipped: integer('skipped').notNull().default(0),
  errors: integer('errors').notNull().default(0),
  chunksCreated: integer('chunks_created').notNull().default(0),
  embedTokens: integer('embed_tokens').notNull().default(0),
  message: text('message'),
  // Per-document breakdown (timing, chunks, tokens, errors).
  details: json('details').$type<SyncDocDetail[]>().default([]),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  finishedAt: timestamp('finished_at'),
});

export type PolicyTopic = typeof policyTopics.$inferSelect;
export type NewPolicyTopic = typeof policyTopics.$inferInsert;
export type PolicyDocument = typeof policyDocuments.$inferSelect;
export type NewPolicyDocument = typeof policyDocuments.$inferInsert;
export type PolicySection = typeof policySections.$inferSelect;
export type NewPolicySection = typeof policySections.$inferInsert;
export type PolicyChunk = typeof policyChunks.$inferSelect;
export type NewPolicyChunk = typeof policyChunks.$inferInsert;
export type PolicySyncJob = typeof policySyncJobs.$inferSelect;
export type NewPolicySyncJob = typeof policySyncJobs.$inferInsert;
