// src/types/sales.ts

// Types for the raw database response
export interface RawSaleRecord {
  _client_bk: string;
  client_name: string;
  _employee_bk: string;
  employee_name: string;
  department_name: string;
  region_name: string;
  sale_date: string;
  formatted_date: string;
  month_year: string;
  sale_amount: number;
}

// Types for the transformed response
export interface SalesResponse {
  data: TransformedSaleRecord[];
}

export interface TransformedSaleRecord {
  client: {
    id: string;
    name: string;
  };
  employee: {
    id: string;
    name: string;
    department: string;
  };
  date: {
    id: string;
    formatted: string;
    monthYear: string;
  };
  region: string;
  saleAmount: number;
}

// Transform function
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