import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../database/db';
import { logger } from '../utils/logger';

export class AuthService {
  async register(email: string, password: string) {
    try {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User already exists');
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const result = await pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
        [email, passwordHash]
      );

      logger.info('User registered', { email });

      return {
        id: result.rows[0].id,
        email: result.rows[0].email
      };
    } catch (error) {
      logger.error('Registration error', error);
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const result = await pool.query(
        'SELECT id, email, password_hash FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

      const token = jwt.sign(
        { userId: user.id },
        secret,
        { expiresIn }
      );

      logger.info('User logged in', { email });

      return {
        token,
        user: {
          id: user.id,
          email: user.email
        }
      };
    } catch (error) {
      logger.error('Login error', error);
      throw error;
    }
  }
}
