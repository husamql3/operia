import { pgTable, text, timestamp, jsonb, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { users } from '.';
import { relations } from 'drizzle-orm';

export const taskStatusEnum = pgEnum('task_status', ['pending', 'approved', 'done', 'archived']);

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  sourceType: text('source_type').notNull(), // 'notion', 'github', etc.
  tags: jsonb('tags').$type<string[]>().default([]),
  status: taskStatusEnum('status').notNull().default('pending'),
  priority: text('priority'), // 'high', 'medium', 'low'
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  approvedAt: timestamp('approved_at'),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
