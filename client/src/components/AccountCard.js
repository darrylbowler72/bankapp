import React from 'react';
import './AccountCard.css';

function AccountCard({ account, onDeposit, onWithdraw, onTransfer, onSelect }) {
  const accountIcon = account.account_type === 'checking' ? '💳' : '🏦';
  const accountColor = account.account_type === 'checking' ? '#667eea' : '#26a69a';

  return (
    <div className="account-card" style={{ borderLeftColor: accountColor }} onClick={onSelect}>
      <div className="account-header">
        <div className="account-icon">{accountIcon}</div>
        <div className="account-info">
          <h4>{account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account</h4>
          <p className="account-number">****{account.id.toString().padStart(4, '0')}</p>
        </div>
      </div>

      <div className="account-balance">
        <p className="balance-label">Available Balance</p>
        <h3 className="balance-value">${parseFloat(account.balance).toFixed(2)}</h3>
      </div>

      <div className="account-actions">
        <button onClick={(e) => { e.stopPropagation(); onDeposit(); }} className="action-btn deposit">
          Deposit
        </button>
        <button onClick={(e) => { e.stopPropagation(); onWithdraw(); }} className="action-btn withdraw">
          Withdraw
        </button>
        <button onClick={(e) => { e.stopPropagation(); onTransfer(); }} className="action-btn transfer">
          Transfer
        </button>
      </div>
    </div>
  );
}

export default AccountCard;
