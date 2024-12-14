import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as duckdb from 'duckdb';
import { config } from './config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createRateLimiterMiddleware, loginLimiter, salesLimiter, closeRedisConnection } from './middleware/rate-limiter';
import { RawSaleRecord, TransformedSaleRecord, transformSaleRecord } from './types/sales';

interface User {
  username: string;
  password: string;
}

interface AuthRequest extends Request {
  user?: any;
}

const usersFile = readFileSync(join(__dirname, '..', 'users.json'), 'utf8');
const { users }: { users: User[] } = JSON.parse(usersFile);

const app = express();
const port = config.apiPort;
const host = config.apiHost;

app.use(express.json());

const db = new duckdb.Database(config.duckdbPath);
const dbConnection = db.connect();

// Authentication middleware
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

// Login endpoint
app.post('/login', createRateLimiterMiddleware(loginLimiter), async (req: Request, res: Response) => {
  const { username, password } = req.body;
  console.log('Login attempt for username:', username);

  const user = users.find((u: User) => u.username === username);
  if (!user) {
    console.log('Invalid password or user:', username);
    return res.status(401).json({ error: 'Invalid password or user' });
  }

  try {
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password verification result:', validPassword);
    
    if (!validPassword) {
      console.log('Invalid password or user:', username);
      return res.status(401).json({ error: 'Invalid password or user' });
    }

    const token = jwt.sign({ username }, config.jwtSecret, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Healthcheck endpoint
app.get('/healthcheck', (_req: Request, res: Response) => {
  res.send('ok');
});

// Protected sales endpoint
app.get('/api/sales', authenticateToken, 
  createRateLimiterMiddleware(salesLimiter), 
  (req: AuthRequest, res: Response) => {
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
  `;

  dbConnection.all(
    query,
    (err: Error | null, result: duckdb.TableData) => {
      if (err) {
        console.error('Query error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!result.length) {
        return res.json({ data: [] });
      }

      const rawRecords = result as unknown as RawSaleRecord[];
      
      const transformedData: TransformedSaleRecord[] = rawRecords.map(transformSaleRecord);

      res.json({ data: transformedData });
    }
  );
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Graceful shutdown
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

app.listen(port, () => {
  console.log(`Server running at http://${host}:${port}`);
});