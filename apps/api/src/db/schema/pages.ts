import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { integrations } from '.';
import { relations } from 'drizzle-orm';

export const notionPages = pgTable('notion_pages', {
  id: text('id').primaryKey(),
  integrationId: uuid('integration_id')
    .notNull()
    .references(() => integrations.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  notionPageId: text('notion_page_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const notionPagesRelations = relations(notionPages, ({ one }) => ({
  integration: one(integrations, {
    fields: [notionPages.integrationId],
    references: [integrations.id],
  }),
}));

export type NotionPage = typeof notionPages.$inferSelect;
export type NewNotionPage = typeof notionPages.$inferInsert;
