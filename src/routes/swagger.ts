import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../swagger';

const router = express.Router();

/**
 * Swagger documentation setup
 * Serves API documentation at the /api-docs endpoint.
 */
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default router;
