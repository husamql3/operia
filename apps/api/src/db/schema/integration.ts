import { pgTable, text, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';
import { users } from '.';
import { relations } from 'drizzle-orm';

export const integrations = pgTable('integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  accessToken: text('access_token').notNull(),
  scope: text('scope'),
  bot: jsonb('bot'),
  workspaceId: text('workspace_id'),
  workspaceName: text('workspace_name'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const integrationsRelations = relations(integrations, ({ one }) => ({
  user: one(users, {
    fields: [integrations.userId],
    references: [users.id],
  }),
}));

export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;
