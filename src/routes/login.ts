import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createRateLimiterMiddleware, loginLimiter } from '../middleware/rate-limiter';
import { config } from '../config';

const router = express.Router();

// Load user data
const usersFile = readFileSync(join(__dirname, '..', 'users.json'), 'utf8');
const { users }: { users: { username: string; password: string }[] } = JSON.parse(usersFile);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Authenticate user and get JWT token
 *     description: |
 *       Login with your username and password to receive a JWT token.
 *       Use this token in the Authorize button above to access protected endpoints.
 *       
 *       Try it out:
 *       1. Click the "Try it out" button below
 *       2. Enter your credentials
 *       3. Click "Execute"
 *       4. Copy the token from the response
 *       5. Click "Authorize" at the top and paste your token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitError'
 */
router.post('/', createRateLimiterMiddleware(loginLimiter), async (req, res) => {
  const { username, password } = req.body;

  const user = users.find((u) => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid password or user' });
  }

  try {
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password or user' });
    }

    const token = jwt.sign({ username }, config.jwtSecret, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
