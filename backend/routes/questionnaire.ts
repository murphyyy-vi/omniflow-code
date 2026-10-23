import { Router, Request } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { AuthedRequest, asyncHandler, requireStudent } from '../middleware/auth';
import { parseBody } from '../middleware/validate';
import { isSubmitted, profileRepository, toProfileDto } from '../repositories/profileRepository';
import { DEFAULT_PRIORITY, detectAnomalies, generateProfile, sanitizeAnswers } from '../services/profileService';
import { QUESTIONS } from '../../shared/questionnaire';
import type { ApiResponse } from '../../shared/types/api';
import type { DraftResponse, ProfileDto } from '../../shared/types/dorm';

const router = Router();

const answersSchema = z.object({
  answers: z.record(z.unknown()),
});

router.use(requireStudent);

router.get(
  '/draft',
  asyncHandler(async (req: Request, res) => {
    const userId = (req as AuthedRequest).userId;
    const row = await profileRepository.getOrCreate(userId);
    const body: ApiResponse<DraftResponse> = {
      success: true,
      data: { answers: row.answers ?? {}, submitted: isSubmitted(row) },
    };
    res.json(body);
  }),
);

router.post(
  '/draft',
  asyncHandler(async (req: Request, res) => {
    const userId = (req as AuthedRequest).userId;
    const { answers } = parseBody(answersSchema, req.body);
    const row = await profileRepository.getOrCreate(userId);
    if (isSubmitted(row)) throw new AppError('问卷已提交，无法修改草稿', 409, 'ALREADY_SUBMITTED');
    const clean = sanitizeAnswers(answers);
    await profileRepository.saveDraft(userId, clean);
    const body: ApiResponse<DraftResponse> = { success: true, data: { answers: clean, submitted: false } };
    res.json(body);
  }),
);

router.post(
  '/submit',
  asyncHandler(async (req: Request, res) => {
    const userId = (req as AuthedRequest).userId;
    const { answers } = parseBody(answersSchema, req.body);
    const row = await profileRepository.getOrCreate(userId);
    if (!row.isDraft && row.aiVersion) throw new AppError('问卷已提交', 409, 'ALREADY_SUBMITTED');

    const clean = sanitizeAnswers(answers);
    const missing = QUESTIONS.filter((q) => clean[q.id] === undefined).length;
    if (missing > 0) throw new AppError(`还有 ${missing} 题未完成，请补全后再提交`, 400, 'INCOMPLETE');

    const seconds = Math.max(0, Math.round((Date.now() - row.startedAt.getTime()) / 1000));
    const anomalyFlags = detectAnomalies(clean, seconds);
    const appLink = req.get('Referer') || req.get('Origin') || `${req.protocol}://${req.get('host')}`;
    const { version, source } = await generateProfile(clean, appLink);

    const saved = await profileRepository.submit(userId, {
      answers: clean,
      completionSeconds: seconds,
      anomalyFlags,
      version,
      source,
      priorityDimensions: DEFAULT_PRIORITY,
    });
    const body: ApiResponse<ProfileDto> = { success: true, data: toProfileDto(saved) };
    res.json(body);
  }),
);

export default router;
