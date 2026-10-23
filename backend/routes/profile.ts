import { Router, Request } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { AuthedRequest, asyncHandler, requireStudent } from '../middleware/auth';
import { parseBody } from '../middleware/validate';
import { isSubmitted, profileRepository, toProfileDto } from '../repositories/profileRepository';
import { DIMENSION_KEYS } from '../../shared/questionnaire';
import type { ApiResponse } from '../../shared/types/api';
import type { ProfileDto, RadarData } from '../../shared/types/dorm';

const router = Router();

const MAX_DELTA = 20;
const score = z.number().int().min(0).max(100);
const dimension = z.enum(['routine', 'hygiene', 'study', 'social', 'environment', 'special']);

const saveSchema = z.object({
  radar: z.object({
    routine: score,
    hygiene: score,
    study: score,
    social: score,
    environment: score,
    special: score,
  }),
  tags: z
    .array(z.string().trim().min(1, '标签不能为空').max(10, '标签最多 10 个字'))
    .min(1, '至少保留一个标签')
    .max(8, '最多 8 个标签'),
  priorityDimensions: z.array(dimension).length(3, '请选择 3 个最看重的维度'),
});

router.use(requireStudent);

router.get(
  '/me',
  asyncHandler(async (req: Request, res) => {
    const row = await profileRepository.findByUserId((req as AuthedRequest).userId);
    if (!isSubmitted(row)) throw new AppError('尚未完成问卷', 404, 'NO_PROFILE');
    const body: ApiResponse<ProfileDto> = { success: true, data: toProfileDto(row) };
    res.json(body);
  }),
);

router.put(
  '/me',
  asyncHandler(async (req: Request, res) => {
    const userId = (req as AuthedRequest).userId;
    const input = parseBody(saveSchema, req.body) as z.infer<typeof saveSchema>;
    const row = await profileRepository.findByUserId(userId);
    if (!isSubmitted(row)) throw new AppError('尚未完成问卷', 404, 'NO_PROFILE');

    const ai = row.aiVersion!;
    for (const key of DIMENSION_KEYS) {
      if (Math.abs(input.radar[key] - ai.radar[key]) > MAX_DELTA) {
        throw new AppError(`“${key}”维度调整幅度不能超过 AI 原始分值 ±${MAX_DELTA} 分`, 400, 'RADAR_DELTA');
      }
    }
    if (new Set(input.priorityDimensions).size !== 3) {
      throw new AppError('最看重的维度不能重复', 400, 'VALIDATION_ERROR');
    }
    const tags = Array.from(new Set(input.tags));
    const summary = row.studentVersion?.summary ?? ai.summary;
    const saved = await profileRepository.updateStudentVersion(
      userId,
      { radar: input.radar as RadarData, tags, summary },
      input.priorityDimensions,
    );
    const body: ApiResponse<ProfileDto> = { success: true, data: toProfileDto(saved) };
    res.json(body);
  }),
);

export default router;
