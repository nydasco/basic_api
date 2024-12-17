import express from 'express';
import cors from 'cors';
import { config } from './config';
import { closeRedisConnection } from './middleware/rate-limiter';

// Route imports
import swaggerRoutes from './routes/swagger';
import loginRoutes from './routes/login';
import healthcheckRoutes from './routes/healthcheck';
import salesRoutes from './routes/sales';

// Application initialization
const app = express();
const port = config.apiPort;
const host = config.apiHost;

// Middleware
app.use(cors()); // Add CORS middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Error handling for JSON parsing
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('JSON parsing error:', err);
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next(err);
});

// Register routes
app.use('/api-docs', swaggerRoutes);
app.use('/login', loginRoutes);
app.use('/healthcheck', healthcheckRoutes);
app.use('/api/sales', salesRoutes);

// General error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  try {
    await closeRedisConnection();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://${host}:${port}`);
  console.log(`API documentation available at http://${host}:${port}/api-docs`);
});

// Handle server errors
server.on('error', (error: any) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      console.error(`Port ${port} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`Port ${port} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

export default app;