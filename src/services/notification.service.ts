import pool from '../database/db';
import { logger } from '../utils/logger';

export class NotificationService {
  async createNotification(userId: number, message: string, type: string) {
    try {
      const result = await pool.query(
        'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3) RETURNING *',
        [userId, message, type]
      );

      logger.info('Notification created', { userId, type });

      return result.rows[0];
    } catch (error) {
      logger.error('Create notification error', error);
      throw error;
    }
  }

  async getNotifications(userId: number, limit: number = 50) {
    try {
      const result = await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Get notifications error', error);
      throw error;
    }
  }

  async markAsRead(notificationId: number, userId: number) {
    try {
      const result = await pool.query(
        'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *',
        [notificationId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Notification not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Mark notification as read error', error);
      throw error;
    }
  }

  async sendAlert(userId: number, message: string) {
    return this.createNotification(userId, message, 'alert');
  }
}
