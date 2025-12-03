import pool from '../database/db';
import { logger } from '../utils/logger';

export class AccountService {
  async createAccount(userId: number, accountType: string = 'checking') {
    try {
      if (!['checking', 'savings'].includes(accountType)) {
        throw new Error('Invalid account type');
      }

      const result = await pool.query(
        'INSERT INTO accounts (user_id, account_type, balance) VALUES ($1, $2, 0.00) RETURNING *',
        [userId, accountType]
      );

      logger.info('Account created', { userId, accountType });

      return result.rows[0];
    } catch (error) {
      logger.error('Create account error', error);
      throw error;
    }
  }

  async getAccounts(userId: number) {
    try {
      const result = await pool.query(
        'SELECT id, account_type, balance, created_at FROM accounts WHERE user_id = $1',
        [userId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Get accounts error', error);
      throw error;
    }
  }

  async getAccountById(accountId: number, userId: number) {
    try {
      const result = await pool.query(
        'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
        [accountId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Account not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Get account error', error);
      throw error;
    }
  }

  async getBalance(accountId: number, userId: number) {
    try {
      const account = await this.getAccountById(accountId, userId);
      return parseFloat(account.balance);
    } catch (error) {
      logger.error('Get balance error', error);
      throw error;
    }
  }
}
