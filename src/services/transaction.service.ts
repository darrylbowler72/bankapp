import pool from '../database/db';
import { logger } from '../utils/logger';
import { NotificationService } from './notification.service';

export class TransactionService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async deposit(accountId: number, userId: number, amount: number, description?: string) {
    const client = await pool.connect();

    try {
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      await client.query('BEGIN');

      const accountCheck = await client.query(
        'SELECT user_id, balance FROM accounts WHERE id = $1',
        [accountId]
      );

      if (accountCheck.rows.length === 0) {
        throw new Error('Account not found');
      }

      if (accountCheck.rows[0].user_id !== userId) {
        throw new Error('Unauthorized');
      }

      await client.query(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
        [amount, accountId]
      );

      const transaction = await client.query(
        'INSERT INTO transactions (account_id, type, amount, description) VALUES ($1, $2, $3, $4) RETURNING *',
        [accountId, 'deposit', amount, description || 'Deposit']
      );

      await client.query('COMMIT');

      logger.info('Deposit completed', { accountId, amount });

      await this.notificationService.createNotification(
        userId,
        `Deposit of $${amount.toFixed(2)} completed successfully`,
        'transaction'
      );

      return transaction.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Deposit error', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async withdraw(accountId: number, userId: number, amount: number, description?: string) {
    const client = await pool.connect();

    try {
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      await client.query('BEGIN');

      const accountCheck = await client.query(
        'SELECT user_id, balance FROM accounts WHERE id = $1',
        [accountId]
      );

      if (accountCheck.rows.length === 0) {
        throw new Error('Account not found');
      }

      if (accountCheck.rows[0].user_id !== userId) {
        throw new Error('Unauthorized');
      }

      const currentBalance = parseFloat(accountCheck.rows[0].balance);

      if (currentBalance < amount) {
        throw new Error('Insufficient funds');
      }

      await client.query(
        'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
        [amount, accountId]
      );

      const transaction = await client.query(
        'INSERT INTO transactions (account_id, type, amount, description) VALUES ($1, $2, $3, $4) RETURNING *',
        [accountId, 'withdrawal', amount, description || 'Withdrawal']
      );

      await client.query('COMMIT');

      logger.info('Withdrawal completed', { accountId, amount });

      await this.notificationService.createNotification(
        userId,
        `Withdrawal of $${amount.toFixed(2)} completed successfully`,
        'transaction'
      );

      return transaction.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Withdrawal error', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async transfer(fromAccountId: number, toAccountId: number, userId: number, amount: number, description?: string) {
    const client = await pool.connect();

    try {
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      if (fromAccountId === toAccountId) {
        throw new Error('Cannot transfer to the same account');
      }

      await client.query('BEGIN');

      const fromAccountCheck = await client.query(
        'SELECT user_id, balance FROM accounts WHERE id = $1',
        [fromAccountId]
      );

      if (fromAccountCheck.rows.length === 0) {
        throw new Error('Source account not found');
      }

      if (fromAccountCheck.rows[0].user_id !== userId) {
        throw new Error('Unauthorized');
      }

      const currentBalance = parseFloat(fromAccountCheck.rows[0].balance);

      if (currentBalance < amount) {
        throw new Error('Insufficient funds');
      }

      const toAccountCheck = await client.query(
        'SELECT id FROM accounts WHERE id = $1',
        [toAccountId]
      );

      if (toAccountCheck.rows.length === 0) {
        throw new Error('Destination account not found');
      }

      await client.query(
        'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
        [amount, fromAccountId]
      );

      await client.query(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
        [amount, toAccountId]
      );

      const transaction = await client.query(
        'INSERT INTO transactions (account_id, type, amount, to_account_id, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [fromAccountId, 'transfer', amount, toAccountId, description || 'Transfer']
      );

      await client.query('COMMIT');

      logger.info('Transfer completed', { fromAccountId, toAccountId, amount });

      await this.notificationService.createNotification(
        userId,
        `Transfer of $${amount.toFixed(2)} to account ${toAccountId} completed successfully`,
        'transaction'
      );

      return transaction.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transfer error', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getTransactionHistory(accountId: number, userId: number, limit: number = 50) {
    try {
      const accountCheck = await pool.query(
        'SELECT user_id FROM accounts WHERE id = $1',
        [accountId]
      );

      if (accountCheck.rows.length === 0) {
        throw new Error('Account not found');
      }

      if (accountCheck.rows[0].user_id !== userId) {
        throw new Error('Unauthorized');
      }

      const result = await pool.query(
        'SELECT * FROM transactions WHERE account_id = $1 ORDER BY timestamp DESC LIMIT $2',
        [accountId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Get transaction history error', error);
      throw error;
    }
  }
}
