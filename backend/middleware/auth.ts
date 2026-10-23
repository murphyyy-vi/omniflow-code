import { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

const TOKEN_TTL = '7d';

const getSecret = (): string => process.env.JWT_SECRET || `dorm-harmony:${process.env.DATABASE_URL ?? 'local'}`;

export interface AuthedRequest extends Request {
  userId: string;
}

export const signToken = (userId: string): string => jwt.sign({ uid: userId }, getSecret(), { expiresIn: TOKEN_TTL });

export const requireStudent: RequestHandler = (req, _res, next) => {
  const header = req.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return next(new AppError('请先登录', 401, 'UNAUTHORIZED'));
  }
  try {
    const payload = jwt.verify(token, getSecret()) as { uid?: string };
    if (!payload.uid) throw new Error('missing uid');
    (req as AuthedRequest).userId = payload.uid;
    return next();
  } catch {
    return next(new AppError('登录已过期，请重新登录', 401, 'TOKEN_EXPIRED'));
  }
};

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncRoute): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
