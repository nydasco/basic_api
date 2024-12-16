# Sales API

A TypeScript-based REST API for sales data management featuring authentication, rate limiting, and interactive API documentation.

## Features

- **Authentication**: JWT-based authentication system
- **Rate Limiting**: Redis-backed rate limiting for login attempts and API calls
- **Data Storage**: DuckDB for efficient analytical queries
- **API Documentation**: Interactive Swagger UI documentation
- **Type Safety**: Full TypeScript implementation
- **Docker Support**: Containerized deployment with Docker Compose

## Prerequisites

- Docker and Docker Compose

That's it! Everything else is handled through Docker.

## Quick Start

1. Clone the repository:
   ```bash
   git clone git@github.com:nydasco/basic_api.git
   cd basic_api
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

3. Access the API documentation at:
   ```
   http://localhost:3000/api-docs
   ```

## Using the API

1. Login using the default credentials:
   ```json
   {
     "username": "admin",
     "password": "password123"
   }
   ```
2. Copy the JWT token from the response
3. Click "Authorize" in the Swagger UI and enter the token
4. Try out any endpoint with the interactive documentation

### Available Endpoints

- `POST /login`: Authenticate and receive JWT token
- `GET /healthcheck`: Check API status (no auth required)
- `GET /api/sales`: Get paginated sales records (auth required)

## Rate Limiting

The API implements rate limiting for security:

- Login attempts: 3 attempts per 60 seconds
- Sales API: 100 requests per 60 seconds

## Data Structure

Sales records include:
- Client information (ID, name)
- Employee details (ID, name, department)
- Date information (raw, formatted, month/year)
- Region
- Sale amount

## Security Features

- Bcrypt password hashing
- JWT authentication
- Rate limiting

## Project Structure

```
basic_api/
├── src/               # Source code
├── data/              # DuckDB database file
├── docker-compose.yml # Docker services config
├── .env              # Configuration file
└── package.json      # Project dependencies
```

## License

ISC License

## Author

Andy Sawyer
