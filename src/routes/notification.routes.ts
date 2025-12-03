import { Router, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const notificationService = new NotificationService();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const notifications = await notificationService.getNotifications(req.userId!, limit);
    res.json({ notifications });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    const notification = await notificationService.markAsRead(notificationId, req.userId!);
    res.json({ notification });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

export default router;
