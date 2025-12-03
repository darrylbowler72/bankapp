import { Router, Response } from 'express';
import { AccountService } from '../services/account.service';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const accountService = new AccountService();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const accounts = await accountService.getAccounts(req.userId!);
    res.json({ accounts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { accountType } = req.body;
    const account = await accountService.createAccount(req.userId!, accountType);
    res.status(201).json({ account });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:accountId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const accountId = parseInt(req.params.accountId);
    const account = await accountService.getAccountById(accountId, req.userId!);
    res.json({ account });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

export default router;
