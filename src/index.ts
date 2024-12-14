/**
 * Main application entry point
 * Implements a secure REST API with the following features:
 * - JWT-based authentication
 * - Rate limiting
 * - DuckDB integration for sales data
 * - Redis for rate limiting
 * - Error handling and input validation
 */

import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as duckdb from 'duckdb';
import { config } from './config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { 
  createRateLimiterMiddleware, 
  loginLimiter, 
  salesLimiter, 
  closeRedisConnection 
} from './middleware/rate-limiter';
import { 
  RawSaleRecord, 
  TransformedSaleRecord, 
  transformSaleRecord 
} from './types/sales';

// Type definitions
interface User {
  username: string;
  password: string;
}

interface AuthRequest extends Request {
  user?: any;
}

interface PaginatedResponse {
  data: TransformedSaleRecord[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
  };
}

// Application initialization
const app = express();
const port = config.apiPort;
const host = config.apiHost;

// Load user data
const usersFile = readFileSync(join(__dirname, '..', 'users.json'), 'utf8');
const { users }: { users: User[] } = JSON.parse(usersFile);

// Middleware setup
app.use(express.json());

// Database initialization
const db = new duckdb.Database(config.duckdbPath);
const dbConnection = db.connect();

/**
 * Authentication middleware
 * Verifies JWT tokens and adds user information to the request
 */
const authenticateToken = (req: AuthRequest, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const user = jwt.verify(token, config.jwtSecret);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Login endpoint
 * Authenticates users and issues JWT tokens
 * Protected by rate limiting to prevent brute force attacks
 */
app.post('/login', createRateLimiterMiddleware(loginLimiter), async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = users.find((u: User) => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid password or user' });
  }

  try {
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password or user' });
    }

    const token = jwt.sign({ username }, config.jwtSecret, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Health check endpoint
 * Used for monitoring system status
 */
app.get('/healthcheck', (_req: Request, res: Response) => {
  res.send('ok');
});

/**
 * Sales data endpoint
 * Returns paginated sales records with optional date filtering
 * Protected by authentication and rate limiting
 */
app.get('/api/sales', 
  authenticateToken, 
  createRateLimiterMiddleware(salesLimiter), 
  (req: AuthRequest, res: Response) => {
    
  // Parse and validate query parameters
  const startDate = req.query.startDate as string || '1900-01-01';
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.max(1, Math.min(1000, parseInt(req.query.pageSize as string) || 100));
  const offset = (page - 1) * pageSize;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD' });
  }

  // Query to get total record count
  const countQuery = `
    SELECT COUNT(*)::INT as total
    FROM dwh.main.fct_sale
    INNER JOIN dwh.main.dim_date
      ON fct_sale.sale_date = dim_date.date_id
    WHERE dim_date.date_id >= ?::DATE
  `;

  const countStmt = dbConnection.prepare(countQuery);
  
  // Execute count query
  countStmt.all(startDate, (countErr: Error | null, countResult: duckdb.TableData) => {
    if (countErr) {
      console.error('Count query error:', countErr);
      return res.status(500).json({ error: 'Database error during count execution' });
    }

    const totalRecords = (countResult[0] as any).total;
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Main query for sales data
    const query = `
      SELECT 
        CAST(dim_client._client_bk AS VARCHAR) as _client_bk,
        dim_client.client_name,
        CAST(dim_employee._employee_bk AS VARCHAR) as _employee_bk,
        dim_employee.employee_name,
        dim_employee.department_name,
        dim_region.region_name,
        CAST(dim_date.date_id AS VARCHAR) as sale_date,
        dim_date.formatted_date,
        dim_date.month_year,
        CAST(fct_sale.sale_amount AS DOUBLE) as sale_amount
      FROM
        dwh.main.fct_sale
        INNER JOIN dwh.main.dim_client
          ON fct_sale._client_hk = dim_client._client_hk
        INNER JOIN dwh.main.dim_employee
          ON fct_sale._employee_hk = dim_employee._employee_hk
        INNER JOIN dwh.main.dim_region
          ON fct_sale._region_hk = dim_region._region_hk
        INNER JOIN dwh.main.dim_date
          ON fct_sale.sale_date = dim_date.date_id
      WHERE
        dim_date.date_id >= ?::DATE
      ORDER BY
        dim_date.date_id ASC
      LIMIT ? OFFSET ?
    `;

    const stmt = dbConnection.prepare(query);
    
    // Execute main query
    stmt.all(startDate, pageSize, offset, (err: Error | null, result: duckdb.TableData) => {
      if (err) {
        console.error('Query error:', err);
        return res.status(500).json({ error: 'Database error during execution' });
      }

      // Handle empty results
      if (!result || !result.length) {
        return res.json({
          data: [],
          pagination: {
            currentPage: page,
            pageSize,
            totalRecords,
            totalPages
          }
        });
      }

      // Transform raw records into API response format
      const rawRecords = result as unknown as RawSaleRecord[];
      const transformedData: TransformedSaleRecord[] = rawRecords.map(transformSaleRecord);

      // Construct paginated response
      const response: PaginatedResponse = {
        data: transformedData,
        pagination: {
          currentPage: page,
          pageSize,
          totalRecords,
          totalPages
        }
      };

      res.json(response);
    });
  });
});

/**
 * Global error handler
 * Catches unhandled errors and returns appropriate response
 */
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

/**
 * Graceful shutdown handler
 * Ensures proper cleanup of database and Redis connections
 */
process.on('SIGTERM', async () => {
  try {
    await closeRedisConnection();
    dbConnection.close();
    db.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://${host}:${port}`);
});