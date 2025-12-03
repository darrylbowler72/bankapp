import React, { useState } from 'react';
import axios from 'axios';
import './TransactionModal.css';

function TransactionModal({ type, account, accounts, token, onClose, onComplete }) {
  const [amount, setAmount] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        accountId: account.id,
        amount: parseFloat(amount),
        description: description || undefined
      };

      let endpoint = '';
      if (type === 'deposit') {
        endpoint = '/transactions/deposit';
      } else if (type === 'withdraw') {
        endpoint = '/transactions/withdraw';
      } else if (type === 'transfer') {
        endpoint = '/transactions/transfer';
        data.fromAccountId = account.id;
        data.toAccountId = parseInt(toAccountId);
        delete data.accountId;
      }

      await axios.post(endpoint, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onComplete();
    } catch (err) {
      setError(err.response?.data?.error || 'Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (type === 'deposit') return 'Deposit Funds';
    if (type === 'withdraw') return 'Withdraw Funds';
    return 'Transfer Funds';
  };

  const getIcon = () => {
    if (type === 'deposit') return '💵';
    if (type === 'withdraw') return '💸';
    return '🔄';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon">{getIcon()}</div>
          <h2>{getTitle()}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>From Account</label>
            <div className="account-display">
              {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account
              <span className="account-balance">Balance: ${parseFloat(account.balance).toFixed(2)}</span>
            </div>
          </div>

          {type === 'transfer' && (
            <div className="form-group">
              <label htmlFor="toAccount">To Account</label>
              <select
                id="toAccount"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                required
              >
                <option value="">Select an account</option>
                {accounts
                  .filter(acc => acc.id !== account.id)
                  .map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_type.charAt(0).toUpperCase() + acc.account_type.slice(1)} Account
                      (Balance: ${parseFloat(acc.balance).toFixed(2)})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <div className="amount-input">
              <span className="currency-symbol">$</span>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Processing...' : `Complete ${type.charAt(0).toUpperCase() + type.slice(1)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransactionModal;
