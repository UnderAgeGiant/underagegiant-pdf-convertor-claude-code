import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redis from '../config/redis';

const isTest = process.env.NODE_ENV === 'test';

export const convertLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min default
  max: parseInt(process.env.RATE_LIMIT_MAX || '10'),
  message: {
    status: 'error',
    message: 'Too many conversion requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // In test mode, use the default in-memory store (no Redis required)
  store: isTest
    ? undefined
    : new RedisStore({
        sendCommand: (...args: string[]) =>
          redis.call(...(args as [string, ...string[]])) as any,
        prefix: 'rl:convert:',
      }),
});
