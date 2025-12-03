import { Router, Response } from 'express';
import { AgentService } from '../services/agent.service';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const agentService = new AgentService();

router.post('/balance-monitor', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await agentService.balanceMonitorAgent();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/customer-assistant', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await agentService.customerAssistantAgent(req.userId!);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/system-health', async (req: Request, res: Response) => {
  try {
    const result = await agentService.systemHealthAgent();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/logs', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = await agentService.getAgentLogs(limit);
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
