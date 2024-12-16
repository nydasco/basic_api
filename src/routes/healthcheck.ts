import express from 'express';

const router = express.Router();

/**
 * @swagger
 * /healthcheck:
 *   get:
 *     summary: Check API health status
 *     description: |
 *       Simple endpoint to verify the API is running.
 *       No authentication required.
 *       
 *       Click "Try it out" to test the API's health!
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: ok
 */
router.get('/', (_req, res) => {
  res.send('ok');
});

export default router;
