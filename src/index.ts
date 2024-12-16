import express from 'express';
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

// Register routes
app.use('/api-docs', swaggerRoutes);
app.use('/login', loginRoutes);
app.use('/healthcheck', healthcheckRoutes);
app.use('/api/sales', salesRoutes);

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
app.listen(port, () => {
  console.log(`Server running at http://${host}:${port}`);
  console.log(`API documentation available at http://${host}:${port}/api-docs`);
});

export default app;
