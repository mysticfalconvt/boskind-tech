import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  json,
  index,
} from 'drizzle-orm/pg-core';

// One row per snapshot run. Keeps the raw payloads so we can re-derive
// resources later if the flattening logic changes.
export const homelabSnapshots = pgTable('homelab_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  takenAt: timestamp('taken_at').defaultNow().notNull(),
  status: varchar('status', { length: 16 }).notNull().default('ok'),
  containerCount: integer('container_count').notNull().default(0),
  vmCount: integer('vm_count').notNull().default(0),
  coolifyAppCount: integer('coolify_app_count').notNull().default(0),
  coolifyDbCount: integer('coolify_db_count').notNull().default(0),
  coolifyServiceCount: integer('coolify_service_count').notNull().default(0),
  errors: text('errors'),
  rawUnraid: json('raw_unraid'),
  rawCoolify: json('raw_coolify'),
});

// Flattened denormalized view. Rewritten from scratch each snapshot so the
// current-state pages always read the newest snapshot's rows with a single
// indexed query — no per-request JSON walk.
export const homelabResources = pgTable(
  'homelab_resources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    snapshotId: uuid('snapshot_id')
      .notNull()
      .references(() => homelabSnapshots.id, { onDelete: 'cascade' }),
    source: varchar('source', { length: 32 }).notNull(),
    kind: varchar('kind', { length: 32 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    hostIp: varchar('host_ip', { length: 45 }),
    port: integer('port'),
    internalPort: integer('internal_port'),
    protocol: varchar('protocol', { length: 8 }),
    url: text('url'),
    state: varchar('state', { length: 32 }),
    stack: varchar('stack', { length: 200 }),
    image: text('image'),
    tags: json('tags'),
    raw: json('raw'),
  },
  (table) => ({
    snapshotIdx: index('homelab_resources_snapshot_idx').on(table.snapshotId),
    hostPortIdx: index('homelab_resources_host_port_idx').on(
      table.hostIp,
      table.port,
    ),
    nameIdx: index('homelab_resources_name_idx').on(table.name),
    stackIdx: index('homelab_resources_stack_idx').on(table.stack),
  }),
);

export type HomelabSnapshot = typeof homelabSnapshots.$inferSelect;
export type NewHomelabSnapshot = typeof homelabSnapshots.$inferInsert;
export type HomelabResource = typeof homelabResources.$inferSelect;
export type NewHomelabResource = typeof homelabResources.$inferInsert;
