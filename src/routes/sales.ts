import express from 'express';
import * as duckdb from 'duckdb';
import { config } from './../config';
import { authenticateToken } from '../middleware/auth';
import { createRateLimiterMiddleware, salesLimiter } from '../middleware/rate-limiter';
import { transformSaleRecord, RawSaleRecord, TransformedSaleRecord } from '../types/sales';

const router = express.Router();
const db = new duckdb.Database(config.duckdbPath);
const dbConnection = db.connect();

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Get paginated sales records
 *     description: |
 *       Retrieve sales records with pagination and date filtering.
 *       
 *       To use this endpoint:
 *       1. Make sure you're authenticated (click Authorize above)
 *       2. Click "Try it out"
 *       3. Set your desired parameters
 *       4. Click "Execute"
 *       
 *       The response includes both the sales data and pagination information.
 *     tags: [Sales]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *         description: Filter sales from this date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         example: 100
 *         description: Number of records per page (max 1000)
 *     responses:
 *       200:
 *         description: List of sales records
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedSalesResponse'
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
router.get('/', 
  authenticateToken, 
  createRateLimiterMiddleware(salesLimiter), 
  (req, res) => {
    const startDate = req.query.startDate as string || '1900-01-01';
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.max(1, Math.min(1000, parseInt(req.query.pageSize as string) || 100));
    const offset = (page - 1) * pageSize;

    if (!/\d{4}-\d{2}-\d{2}/.test(startDate)) {
      return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD' });
    }

    const countQuery = `
      SELECT COUNT(*)::INT as total
      FROM dwh.main.fct_sale
      INNER JOIN dwh.main.dim_date
        ON fct_sale.sale_date = dim_date.date_id
      WHERE dim_date.date_id >= ?::DATE
    `;

    dbConnection.prepare(countQuery).all(startDate, (countErr, countResult) => {
      if (countErr) {
        console.error('Count query error:', countErr);
        return res.status(500).json({ error: 'Database error during count execution' });
      }

      const totalRecords = (countResult[0] as any).total;
      const totalPages = Math.ceil(totalRecords / pageSize);

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

      dbConnection.prepare(query).all(startDate, pageSize, offset, (err, result) => {
        if (err) {
          console.error('Query error:', err);
          return res.status(500).json({ error: 'Database error during execution' });
        }

        const rawRecords = result as RawSaleRecord[];
        const transformedData: TransformedSaleRecord[] = rawRecords.map(transformSaleRecord);

        res.json({
          data: transformedData,
          pagination: {
            currentPage: page,
            pageSize,
            totalRecords,
            totalPages
          }
        });
      });
    });
});

export default router;
