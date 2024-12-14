/**
 * Type definitions for sales-related data structures
 * Includes both raw database record types and transformed response types
 */

/**
 * Raw sale record structure as returned from the database
 * Represents the direct mapping of database columns to TypeScript types
 */
export interface RawSaleRecord {
  _client_bk: string;      // Business key for client
  client_name: string;     // Client's full name
  _employee_bk: string;    // Business key for employee
  employee_name: string;   // Employee's full name
  department_name: string; // Employee's department
  region_name: string;     // Sales region name
  sale_date: string;       // Date of sale (YYYY-MM-DD)
  formatted_date: string;  // Human-readable date format
  month_year: string;      // Month and year of sale
  sale_amount: number;     // Amount of the sale
}

/**
 * API response structure for sales data
 * Wraps transformed sale records in a data property
 */
export interface SalesResponse {
  data: TransformedSaleRecord[];
}

/**
 * Transformed sale record structure for API responses
 * Organizes raw data into logical groupings for better readability
 */
export interface TransformedSaleRecord {
  client: {
    id: string;    // Client's business key
    name: string;  // Client's name
  };
  employee: {
    id: string;        // Employee's business key
    name: string;      // Employee's name
    department: string; // Employee's department
  };
  date: {
    id: string;        // Raw date (YYYY-MM-DD)
    formatted: string; // Formatted date string
    monthYear: string; // Month and year
  };
  region: string;     // Region name
  saleAmount: number; // Sale amount
}

/**
 * Transforms a raw sale record from the database into the API response format
 * Groups related fields together and renames properties for clarity
 * 
 * @param raw - Raw sale record from database
 * @returns Transformed sale record for API response
 */
export const transformSaleRecord = (raw: RawSaleRecord): TransformedSaleRecord => ({
  client: {
    id: raw._client_bk,
    name: raw.client_name
  },
  employee: {
    id: raw._employee_bk,
    name: raw.employee_name,
    department: raw.department_name
  },
  date: {
    id: raw.sale_date,
    formatted: raw.formatted_date,
    monthYear: raw.month_year
  },
  region: raw.region_name,
  saleAmount: raw.sale_amount
});