import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sales API',
      version: '1.0.0',
      description: `
REST API for sales data management with authentication and rate limiting.

## Quick Start
1. Use the \`/login\` endpoint to get your JWT token
2. Click the "Authorize" button at the top and enter your token
3. Try out any endpoint with the "Try it out" button
4. View the response in the UI

## Authentication
- All endpoints except \`/login\` and \`/healthcheck\` require authentication
- Use the JWT token in the format: \`Bearer your-token-here\`
      `,
      contact: {
        name: 'Andy Sawyer',
      },
    },
    servers: [
      {
        url: `http://{host}:{port}`,
        variables: {
          host: {
            default: 'localhost',
            description: 'API host'
          },
          port: {
            default: '3000',
            description: 'API port'
          }
        }
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              example: 'admin',
              description: 'Your username'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'password123',
              description: 'Your password'
            }
          },
          example: {
            username: "admin",
            password: "password123"
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              description: 'JWT token to be used for authentication'
            }
          },
          example: {
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyfQ.L8i6g3PfcHlioHCCPURC9pmXT7gdJpx3kOoyAfNUwCc"
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Invalid password or user'
            }
          }
        },
        RateLimitError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Too Many Requests'
            },
            retryAfter: {
              type: 'number',
              example: 60,
              description: 'Number of seconds to wait before retrying'
            }
          }
        },
        SaleRecord: {
          type: 'object',
          properties: {
            client: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'CLIENT001' },
                name: { type: 'string', example: 'Acme Corp' }
              }
            },
            employee: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'EMP001' },
                name: { type: 'string', example: 'John Doe' },
                department: { type: 'string', example: 'Sales' }
              }
            },
            date: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '2024-03-14' },
                formatted: { type: 'string', example: 'March 14, 2024' },
                monthYear: { type: 'string', example: 'March 2024' }
              }
            },
            region: { type: 'string', example: 'North America' },
            saleAmount: { type: 'number', example: 1500.50 }
          }
        },
        PaginatedSalesResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/SaleRecord'
              }
            },
            pagination: {
              type: 'object',
              properties: {
                currentPage: { type: 'number', example: 1 },
                pageSize: { type: 'number', example: 100 },
                totalRecords: { type: 'number', example: 1500 },
                totalPages: { type: 'number', example: 15 }
              }
            }
          },
          example: {
            data: [
              {
                client: {
                  id: "CLIENT001",
                  name: "Acme Corp"
                },
                employee: {
                  id: "EMP001",
                  name: "John Doe",
                  department: "Sales"
                },
                date: {
                  id: "2024-03-14",
                  formatted: "March 14, 2024",
                  monthYear: "March 2024"
                },
                region: "North America",
                saleAmount: 1500.50
              }
            ],
            pagination: {
              currentPage: 1,
              pageSize: 100,
              totalRecords: 1500,
              totalPages: 15
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: ['./src/index.ts'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;