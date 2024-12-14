import { log } from 'console';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in environment variables');
}

if (!process.env.API_PORT) {
  throw new Error('API_PORT is required in environment variables');
}

if (!process.env.API_HOST) {
  throw new Error('API_HOST is required in environment variables');
}

if (!process.env.DUCKDB_PATH) {
  throw new Error('DUCKDB_PATH is required in environment variables');
}

if (!process.env.REDIS_PORT) {
  throw new Error('REDIS_PORT is required in environment variables');
}

if (!process.env.LOGIN_ATTEMPT) {
  throw new Error('LOGIN_ATTEMPT is required in environment variables');
}

if (!process.env.LOGIN_DURATION) {
  throw new Error('LOGIN_DURATION is required in environment variables');
}

if (!process.env.SALE_ATTEMPT) {
  throw new Error('SALE_ATTEMPT is required in environment variables');
}

if (!process.env.SALE_DURATION) {
  throw new Error('SALE_DURATION is required in environment variables');
}

export const config = {
  jwtSecret: process.env.JWT_SECRET,
  apiPort: process.env.API_PORT ? parseInt(process.env.API_PORT) : 3000,
  apiHost: process.env.API_HOST || 'localhost',
  duckdbPath: process.env.DUCKDB_PATH,
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  loginAttempt: process.env.LOGIN_ATTEMPT ? parseInt(process.env.LOGIN_ATTEMPT) : 3,
  loginDuration: process.env.LOGIN_DURATION ? parseInt(process.env.LOGIN_DURATION) : 60,
  saleAttempt: process.env.SALE_ATTEMPT ? parseInt(process.env.SALE_ATTEMPT) : 100,
  saleDuration: process.env.SALE_DURATION ? parseInt(process.env.SALE_DURATION) : 60,
} as const;