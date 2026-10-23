import { z, ZodType } from 'zod';
import { AppError } from './errorHandler';

export const parseBody = <S extends ZodType>(schema: S, body: unknown): z.infer<S> => {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues[0]?.message || '请求参数不正确';
    throw new AppError(message, 400, 'VALIDATION_ERROR');
  }
  return result.data as z.infer<S>;
};
