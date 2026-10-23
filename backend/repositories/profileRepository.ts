import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { userProfiles, type UserProfileRow } from '../db/schema';
import type { Answers, DimensionKey } from '../../shared/questionnaire';
import type { AnomalyFlag, ProfileDto, ProfileVersion } from '../../shared/types/dorm';

export const isSubmitted = (row: UserProfileRow | undefined): row is UserProfileRow =>
  Boolean(row && !row.isDraft && row.aiVersion && row.radarData && row.tags);

export const toProfileDto = (row: UserProfileRow): ProfileDto => {
  const { source, ...ai } = row.aiVersion!;
  const aiVersion: ProfileVersion = { radar: ai.radar, tags: ai.tags, summary: ai.summary };
  return {
    aiVersion,
    source,
    studentVersion: row.studentVersion ?? aiVersion,
    edited: row.studentVersion !== null,
    priorityDimensions: row.priorityDimensions ?? [],
    submittedAt: (row.submittedAt ?? row.updatedAt).toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
};

export const profileRepository = {
  async findByUserId(userId: string): Promise<UserProfileRow | undefined> {
    const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    return rows[0];
  },

  async getOrCreate(userId: string): Promise<UserProfileRow> {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;
    const rows = await db
      .insert(userProfiles)
      .values({ id: randomUUID(), userId })
      .onConflictDoNothing({ target: userProfiles.userId })
      .returning();
    if (rows[0]) return rows[0];
    const again = await this.findByUserId(userId);
    if (!again) throw new Error('Failed to create questionnaire record');
    return again;
  },

  async saveDraft(userId: string, answers: Answers): Promise<void> {
    await this.getOrCreate(userId);
    await db.update(userProfiles).set({ answers, updatedAt: new Date() }).where(eq(userProfiles.userId, userId));
  },

  async submit(
    userId: string,
    input: {
      answers: Answers;
      completionSeconds: number;
      anomalyFlags: AnomalyFlag[];
      version: ProfileVersion;
      source: 'ai' | 'rule';
      priorityDimensions: DimensionKey[];
    },
  ): Promise<UserProfileRow> {
    const now = new Date();
    const rows = await db
      .update(userProfiles)
      .set({
        answers: input.answers,
        isDraft: false,
        submittedAt: now,
        completionSeconds: input.completionSeconds,
        anomalyFlags: input.anomalyFlags,
        radarData: input.version.radar,
        tags: input.version.tags,
        summary: input.version.summary,
        priorityDimensions: input.priorityDimensions,
        aiVersion: { ...input.version, source: input.source },
        studentVersion: null,
        updatedAt: now,
      })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return rows[0];
  },

  async updateStudentVersion(
    userId: string,
    version: ProfileVersion,
    priorityDimensions: DimensionKey[],
  ): Promise<UserProfileRow> {
    const rows = await db
      .update(userProfiles)
      .set({
        radarData: version.radar,
        tags: version.tags,
        summary: version.summary,
        studentVersion: version,
        priorityDimensions,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return rows[0];
  },
};
