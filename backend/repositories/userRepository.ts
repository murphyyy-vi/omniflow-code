import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, type UserRow } from '../db/schema';
import type { Campus, Gender, UserDto } from '../../shared/types/dorm';

export const toUserDto = (row: UserRow): UserDto => ({
  id: row.id,
  studentId: row.studentId,
  name: row.name,
  gender: row.gender as Gender,
  major: row.major,
  campus: row.campus as Campus,
  role: row.role as UserDto['role'],
});

export const userRepository = {
  async findByStudentId(studentId: string): Promise<UserRow | undefined> {
    const rows = await db.select().from(users).where(eq(users.studentId, studentId)).limit(1);
    return rows[0];
  },

  async findById(id: string): Promise<UserRow | undefined> {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0];
  },

  async create(input: {
    studentId: string;
    name: string;
    gender: Gender;
    major: string;
    campus: Campus;
  }): Promise<UserRow> {
    const rows = await db
      .insert(users)
      .values({ id: randomUUID(), ...input, role: 'student' })
      .returning();
    return rows[0];
  },
};
