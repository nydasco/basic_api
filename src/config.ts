import dotenv from 'dotenv';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in environment variables');
}

if (!process.env.DUCKDB_PATH) {
  throw new Error('DUCKDB_PATH is required in environment variables');
}

export const config = {
  jwtSecret: process.env.JWT_SECRET,
  duckdbPath: process.env.DUCKDB_PATH,
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000
} as const;