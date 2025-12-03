import pool from '../database/db';
import { logger } from '../utils/logger';
import { NotificationService } from './notification.service';

export class AgentService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async logAgentAction(agentType: string, action: string, details: any) {
    try {
      await pool.query(
        'INSERT INTO agent_logs (agent_type, action, details) VALUES ($1, $2, $3)',
        [agentType, action, JSON.stringify(details)]
      );
    } catch (error) {
      logger.error('Log agent action error', error);
    }
  }

  async balanceMonitorAgent() {
    try {
      const largeWithdrawals = await pool.query(`
        SELECT t.*, a.user_id, a.balance
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE t.type = 'withdrawal'
        AND t.amount > 1000
        AND t.timestamp > NOW() - INTERVAL '1 hour'
        ORDER BY t.timestamp DESC
      `);

      for (const withdrawal of largeWithdrawals.rows) {
        const userId = withdrawal.user_id;
        const amount = parseFloat(withdrawal.amount);

        await this.notificationService.sendAlert(
          userId,
          `Large withdrawal detected: $${amount.toFixed(2)}. If this wasn't you, please contact support immediately.`
        );

        await this.logAgentAction('balance_monitor', 'large_withdrawal_alert', {
          userId,
          amount,
          accountId: withdrawal.account_id
        });

        logger.warn('Large withdrawal detected', {
          userId,
          amount,
          accountId: withdrawal.account_id
        });
      }

      const lowBalances = await pool.query(`
        SELECT a.*, u.id as user_id
        FROM accounts a
        JOIN users u ON a.user_id = u.id
        WHERE a.balance < 100
        AND a.balance > 0
      `);

      for (const account of lowBalances.rows) {
        await this.notificationService.createNotification(
          account.user_id,
          `Your account balance is low: $${parseFloat(account.balance).toFixed(2)}`,
          'alert'
        );

        await this.logAgentAction('balance_monitor', 'low_balance_alert', {
          userId: account.user_id,
          balance: account.balance,
          accountId: account.id
        });
      }

      return {
        largeWithdrawalsDetected: largeWithdrawals.rows.length,
        lowBalanceAccountsDetected: lowBalances.rows.length
      };
    } catch (error) {
      logger.error('Balance monitor agent error', error);
      throw error;
    }
  }

  async customerAssistantAgent(userId: number) {
    try {
      const recentTransactions = await pool.query(`
        SELECT t.*, a.account_type
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE a.user_id = $1
        AND t.timestamp > NOW() - INTERVAL '30 days'
        ORDER BY t.timestamp DESC
      `, [userId]);

      let totalSpent = 0;
      let totalDeposited = 0;
      const transactionCount = recentTransactions.rows.length;

      for (const transaction of recentTransactions.rows) {
        const amount = parseFloat(transaction.amount);
        if (transaction.type === 'withdrawal' || transaction.type === 'transfer') {
          totalSpent += amount;
        } else if (transaction.type === 'deposit') {
          totalDeposited += amount;
        }
      }

      const summary = {
        period: 'Last 30 days',
        totalTransactions: transactionCount,
        totalSpent: totalSpent.toFixed(2),
        totalDeposited: totalDeposited.toFixed(2),
        netChange: (totalDeposited - totalSpent).toFixed(2),
        averageTransactionAmount: transactionCount > 0
          ? ((totalSpent + totalDeposited) / transactionCount).toFixed(2)
          : '0.00'
      };

      let recommendation = '';
      if (totalSpent > totalDeposited) {
        recommendation = 'You\'re spending more than you\'re depositing. Consider reviewing your expenses.';
      } else if (totalDeposited > totalSpent * 2) {
        recommendation = 'Great job saving! You might want to consider investment opportunities.';
      } else {
        recommendation = 'Your spending and saving are balanced. Keep up the good work!';
      }

      await this.logAgentAction('customer_assistant', 'spending_summary', {
        userId,
        summary,
        recommendation
      });

      return {
        summary,
        recommendation
      };
    } catch (error) {
      logger.error('Customer assistant agent error', error);
      throw error;
    }
  }

  async systemHealthAgent() {
    try {
      const checks = {
        database: false,
        responseTime: 0,
        errorRate: 0
      };

      const startTime = Date.now();

      try {
        await pool.query('SELECT 1');
        checks.database = true;
        checks.responseTime = Date.now() - startTime;
      } catch (error) {
        checks.database = false;
      }

      const recentErrors = await pool.query(`
        SELECT COUNT(*) as error_count
        FROM agent_logs
        WHERE timestamp > NOW() - INTERVAL '1 hour'
        AND details->>'error' IS NOT NULL
      `);

      checks.errorRate = parseInt(recentErrors.rows[0]?.error_count || '0');

      const status = checks.database && checks.responseTime < 300 ? 'healthy' : 'degraded';

      await this.logAgentAction('system_health', 'health_check', {
        status,
        checks
      });

      if (status === 'degraded') {
        logger.warn('System health degraded', checks);
      } else {
        logger.info('System health check passed', checks);
      }

      return {
        status,
        checks,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('System health agent error', error);
      await this.logAgentAction('system_health', 'health_check_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getAgentLogs(limit: number = 100) {
    try {
      const result = await pool.query(
        'SELECT * FROM agent_logs ORDER BY timestamp DESC LIMIT $1',
        [limit]
      );
      return result.rows;
    } catch (error) {
      logger.error('Get agent logs error', error);
      throw error;
    }
  }
}
