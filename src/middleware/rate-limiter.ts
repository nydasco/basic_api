/**
 * Rate limiting middleware implementation using Redis
 * Provides protection against brute force attacks and API abuse
 * 
 * Features:
 * - Separate limits for login attempts and API calls
 * - Redis-based storage for distributed rate limiting
 * - IP-based and user-based rate limiting
 * - Configurable attempt limits and time windows
 */

import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';
import { config } from './../config';

/**
 * Extended Express Request interface that includes optional user information
 * Used for authenticated endpoints where user information is available
 */
interface AuthenticatedRequest extends Request {
  user?: {
    username: string;
  };
}

/**
 * Redis client configuration
 * Uses environment variables for connection details
 */
const redis = new Redis({
  host: config.redisHost,
  port: config.redisPort,
  enableOfflineQueue: false, // Fail fast if Redis is down
});

/**
 * Rate limiter for login attempts
 * More restrictive to prevent brute force attacks
 */
const loginLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'login_limit',
  points: config.loginAttempt,    // Maximum number of attempts
  duration: config.loginDuration, // Time window in seconds
});

/**
 * Rate limiter for sales API endpoints
 * More lenient to allow normal API usage patterns
 */
const salesLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'sales_limit',
  points: config.saleAttempt,    // Maximum number of requests
  duration: config.saleDuration, // Time window in seconds
});

/**
 * Creates a middleware function for rate limiting
 * Combines IP-based and user-based rate limiting for authenticated routes
 * 
 * @param limiter - RateLimiterRedis instance to use for rate limiting
 * @returns Express middleware function
 */
const createRateLimiterMiddleware = (limiter: RateLimiterRedis) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Get client identifier (IP address or IP + username for authenticated requests)
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const key = req.user ? `${ip}_${req.user.username}` : ip;
      
      // Attempt to consume a point from the rate limiter
      await limiter.consume(key);
      next();
    } catch (error: any) {
      // Handle different types of errors
      if (error instanceof Error) {
        console.error('Rate limiter error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      
      // Rate limit exceeded - return 429 with retry information
      return res.status(429).json({
        error: 'Too Many Requests',
        retryAfter: Math.ceil(error.msBeforeNext / 1000) || 60
      });
    }
  };
};

/**
 * Gracefully closes the Redis connection
 * Should be called during application shutdown
 */
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