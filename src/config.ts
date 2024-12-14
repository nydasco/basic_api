/**
 * Configuration management module for the API server
 * Uses environment variables to configure all server settings
 * 
 * Environment Variables Required:
 * - JWT_SECRET: Secret key for JWT token generation/validation
 * - API_PORT: Port number for the API server
 * - API_HOST: Host address for the API server
 * - DUCKDB_PATH: File path to the DuckDB database
 * - REDIS_PORT: Port number for Redis connection
 * - REDIS_HOST: Hostname for Redis connection
 * - LOGIN_ATTEMPT: Maximum number of login attempts allowed
 * - LOGIN_DURATION: Duration (in seconds) for login attempt tracking
 * - SALE_ATTEMPT: Maximum number of sale API requests allowed
 * - SALE_DURATION: Duration (in seconds) for sale request tracking
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Required environment variables validation
const requiredEnvVars = [
  'JWT_SECRET',
  'API_PORT',
  'API_HOST',
  'DUCKDB_PATH',
  'REDIS_PORT',
  'LOGIN_ATTEMPT',
  'LOGIN_DURATION',
  'SALE_ATTEMPT',
  'SALE_DURATION'
] as const;

// Check for missing environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} is required in environment variables`);
  }
}

/**
 * Configuration object containing all server settings
 * Values are parsed from environment variables with sensible defaults where appropriate
 */
export const config = {
  jwtSecret: process.env.JWT_SECRET!,
  apiPort: parseInt(process.env.API_PORT!) || 3000,
  apiHost: process.env.API_HOST || 'localhost',
  duckdbPath: process.env.DUCKDB_PATH!,
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT!) || 6379,
  loginAttempt: parseInt(process.env.LOGIN_ATTEMPT!) || 3,
  loginDuration: parseInt(process.env.LOGIN_DURATION!) || 60,
  saleAttempt: parseInt(process.env.SALE_ATTEMPT!) || 100,
  saleDuration: parseInt(process.env.SALE_DURATION!) || 60,
} as const;