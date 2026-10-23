import { boolean, index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { Answers, DimensionKey } from '../../shared/questionnaire';
import type { AnomalyFlag, ProfileVersion } from '../../shared/types/dorm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().unique(),
  name: text('name').notNull(),
  gender: text('gender').notNull(),
  major: text('major').notNull(),
  campus: text('campus').notNull(),
  role: text('role').notNull().default('student'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const userProfiles = pgTable(
  'user_profiles',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => users.id),
    answers: jsonb('answers').$type<Answers>().notNull().default({}),
    isDraft: boolean('is_draft').notNull().default(true),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    submittedAt: timestamp('submitted_at'),
    completionSeconds: integer('completion_seconds'),
    anomalyFlags: jsonb('anomaly_flags').$type<AnomalyFlag[]>().notNull().default([]),
    radarData: jsonb('radar_data').$type<ProfileVersion['radar']>(),
    tags: jsonb('tags').$type<string[]>(),
    summary: text('summary'),
    priorityDimensions: jsonb('priority_dimensions').$type<DimensionKey[]>(),
    aiVersion: jsonb('ai_version').$type<ProfileVersion & { source: 'ai' | 'rule' }>(),
    studentVersion: jsonb('student_version').$type<ProfileVersion>(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('idx_user_profiles_user_id').on(table.userId)],
);

export type UserRow = typeof users.$inferSelect;
export type UserProfileRow = typeof userProfiles.$inferSelect;
