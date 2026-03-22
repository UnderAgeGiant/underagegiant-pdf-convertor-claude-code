import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from './logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  logger.error({ error: err.message, stack: err.stack, url: req.url });

  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  return res.status(500).json({ status: 'error', message });
};
