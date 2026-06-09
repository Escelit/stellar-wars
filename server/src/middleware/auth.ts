import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type JwtPayload } from '@/lib/jwt';
import { AppError } from './errorHandler';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required');
    }

    const token = header.slice(7);
    req.user = verifyToken(token);
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError(401, 'Invalid or expired token'));
    }
  }
}
