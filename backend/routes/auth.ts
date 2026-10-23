import { Router, Request } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { AuthedRequest, asyncHandler, requireStudent, signToken } from '../middleware/auth';
import { parseBody } from '../middleware/validate';
import { profileRepository, isSubmitted } from '../repositories/profileRepository';
import { toUserDto, userRepository } from '../repositories/userRepository';
import type { ApiResponse } from '../../shared/types/api';
import type { AuthResponse, MeResponse, Stage } from '../../shared/types/dorm';

const router = Router();

const registerSchema = z.object({
  studentId: z
    .string()
    .trim()
    .regex(/^\d{6,12}$/, '学号格式不正确（6-12 位数字）'),
  name: z.string().trim().min(2, '请输入真实姓名').max(20, '姓名过长'),
  gender: z.enum(['male', 'female'], { errorMap: () => ({ message: '请选择性别' }) }),
  major: z.string().trim().min(2, '请填写专业').max(40, '专业名称过长'),
  campus: z.enum(['pukou', 'mochou'], { errorMap: () => ({ message: '请选择校区' }) }),
});

const loginSchema = z.object({
  studentId: z.string().trim().min(1, '请输入学号'),
  name: z.string().trim().min(1, '请输入姓名'),
});

const stageOf = async (userId: string): Promise<Stage> => {
  const profile = await profileRepository.findByUserId(userId);
  return isSubmitted(profile) ? 'profile' : 'questionnaire';
};

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const input = parseBody(registerSchema, req.body) as z.infer<typeof registerSchema>;
    if (await userRepository.findByStudentId(input.studentId)) {
      throw new AppError('该学号已注册，请直接登录', 409, 'STUDENT_EXISTS');
    }
    let user;
    try {
      user = await userRepository.create(input as Parameters<typeof userRepository.create>[0]);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new AppError('该学号已注册，请直接登录', 409, 'STUDENT_EXISTS');
      }
      throw error;
    }
    const body: ApiResponse<AuthResponse> = {
      success: true,
      data: { token: signToken(user.id), user: toUserDto(user), stage: 'questionnaire' },
    };
    res.status(201).json(body);
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const input = parseBody(loginSchema, req.body);
    const user = await userRepository.findByStudentId(input.studentId);
    if (!user) throw new AppError('学号不存在，请先注册', 404, 'STUDENT_NOT_FOUND');
    if (user.name !== input.name) throw new AppError('学号与姓名不匹配', 401, 'NAME_MISMATCH');
    const body: ApiResponse<AuthResponse> = {
      success: true,
      data: { token: signToken(user.id), user: toUserDto(user), stage: await stageOf(user.id) },
    };
    res.json(body);
  }),
);

router.get(
  '/me',
  requireStudent,
  asyncHandler(async (req: Request, res) => {
    const userId = (req as AuthedRequest).userId;
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('账号不存在，请重新登录', 401, 'UNAUTHORIZED');
    const body: ApiResponse<MeResponse> = {
      success: true,
      data: { user: toUserDto(user), stage: await stageOf(user.id) },
    };
    res.json(body);
  }),
);

export default router;
