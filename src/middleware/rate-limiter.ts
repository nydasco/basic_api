import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';
import { config } from './../config';

interface AuthenticatedRequest extends Request {
  user?: {
    username: string;
  };
}

const redis = new Redis({
    host: config.redisHost,
    port: config.redisPort,
    enableOfflineQueue: false,
  });
  
  const loginLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'login_limit',
    points: config.loginAttempt,
    duration: config.loginDuration,
  });
  
  const salesLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'sales_limit',
    points: config.saleAttempt, 
    duration: config.saleDuration,
  });

const createRateLimiterMiddleware = (limiter: RateLimiterRedis) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const key = req.user ? `${ip}_${req.user.username}` : ip;
      
      await limiter.consume(key);
      next();
    } catch (error: any) {
      if (error instanceof Error) {
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      return res.status(429).json({
        error: 'Too Many Requests',
        retryAfter: Math.ceil(error.msBeforeNext / 1000) || 60
      });
    }
  };
};

const closeRedisConnection = async () => {
  await redis.quit();
};

export {
  createRateLimiterMiddleware,
  loginLimiter,
  salesLimiter,
  closeRedisConnection,
  AuthenticatedRequest
};