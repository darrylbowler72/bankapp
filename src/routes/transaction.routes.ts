import { Router, Response } from 'express';
import { TransactionService } from '../services/transaction.service';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const transactionService = new TransactionService();

router.post('/deposit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { accountId, amount, description } = req.body;

    if (!accountId || !amount) {
      return res.status(400).json({ error: 'Account ID and amount are required' });
    }

    const transaction = await transactionService.deposit(
      accountId,
      req.userId!,
      parseFloat(amount),
      description
    );

    res.status(201).json({ transaction });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/withdraw', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { accountId, amount, description } = req.body;

    if (!accountId || !amount) {
      return res.status(400).json({ error: 'Account ID and amount are required' });
    }

    const transaction = await transactionService.withdraw(
      accountId,
      req.userId!,
      parseFloat(amount),
      description
    );

    res.status(201).json({ transaction });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/transfer', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { fromAccountId, toAccountId, amount, description } = req.body;

    if (!fromAccountId || !toAccountId || !amount) {
      return res.status(400).json({ error: 'From account, to account, and amount are required' });
    }

    const transaction = await transactionService.transfer(
      fromAccountId,
      toAccountId,
      req.userId!,
      parseFloat(amount),
      description
    );

    res.status(201).json({ transaction });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:accountId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const accountId = parseInt(req.params.accountId);
    const limit = parseInt(req.query.limit as string) || 50;

    const transactions = await transactionService.getTransactionHistory(
      accountId,
      req.userId!,
      limit
    );

    res.json({ transactions });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
