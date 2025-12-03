import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';
import AccountCard from './AccountCard';
import TransactionModal from './TransactionModal';
import AIInsights from './AIInsights';

function Dashboard({ token, user, onLogout }) {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactionType, setTransactionType] = useState('deposit');

  useEffect(() => {
    fetchAccounts();
    fetchNotifications();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('/accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccounts(response.data.accounts);
      if (response.data.accounts.length > 0) {
        setSelectedAccount(response.data.accounts[0]);
        fetchTransactions(response.data.accounts[0].id);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (accountId) => {
    try {
      const response = await axios.get(`/transactions/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const createAccount = async (accountType) => {
    try {
      await axios.post('/accounts', { accountType }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAccounts();
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  const openTransactionModal = (type, account) => {
    setTransactionType(type);
    setSelectedAccount(account);
    setShowTransactionModal(true);
  };

  const handleTransactionComplete = () => {
    setShowTransactionModal(false);
    fetchAccounts();
    if (selectedAccount) {
      fetchTransactions(selectedAccount.id);
    }
    fetchNotifications();
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading your accounts...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <span className="nav-icon">💳</span>
          <span className="nav-title">Banking App</span>
        </div>
        <div className="nav-user">
          <span className="user-email">{user?.email}</span>
          <button onClick={onLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>Welcome back!</h1>
            <p className="subtitle">Here's your financial overview</p>
          </div>
          <div className="header-actions">
            <button onClick={() => createAccount('checking')} className="btn-secondary">
              + New Checking
            </button>
            <button onClick={() => createAccount('savings')} className="btn-secondary">
              + New Savings
            </button>
          </div>
        </div>

        <div className="balance-overview">
          <div className="balance-card">
            <div className="balance-icon">💰</div>
            <div>
              <p className="balance-label">Total Balance</p>
              <h2 className="balance-amount">${totalBalance.toFixed(2)}</h2>
            </div>
          </div>
          <div className="balance-stats">
            <div className="stat-item">
              <span className="stat-icon">🏦</span>
              <div>
                <p className="stat-value">{accounts.length}</p>
                <p className="stat-label">Accounts</p>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">📊</span>
              <div>
                <p className="stat-value">{transactions.length}</p>
                <p className="stat-label">Transactions</p>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🔔</span>
              <div>
                <p className="stat-value">{notifications.filter(n => !n.read).length}</p>
                <p className="stat-label">Notifications</p>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="accounts-section">
            <h3>Your Accounts</h3>
            {accounts.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🏦</span>
                <p>No accounts yet</p>
                <button onClick={() => createAccount('checking')} className="btn-primary">
                  Create Your First Account
                </button>
              </div>
            ) : (
              <div className="accounts-grid">
                {accounts.map(account => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onDeposit={() => openTransactionModal('deposit', account)}
                    onWithdraw={() => openTransactionModal('withdraw', account)}
                    onTransfer={() => openTransactionModal('transfer', account)}
                    onSelect={() => {
                      setSelectedAccount(account);
                      fetchTransactions(account.id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="transactions-section">
            <h3>Recent Transactions</h3>
            {transactions.length === 0 ? (
              <div className="empty-state-small">
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="transactions-list">
                {transactions.slice(0, 10).map(transaction => (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-icon">
                      {transaction.type === 'deposit' ? '💵' :
                       transaction.type === 'withdrawal' ? '💸' : '🔄'}
                    </div>
                    <div className="transaction-details">
                      <p className="transaction-desc">{transaction.description}</p>
                      <p className="transaction-date">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`transaction-amount ${
                      transaction.type === 'deposit' ? 'positive' : 'negative'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <AIInsights token={token} />

        {notifications.length > 0 && (
          <div className="notifications-section">
            <h3>Notifications</h3>
            <div className="notifications-list">
              {notifications.slice(0, 5).map(notification => (
                <div key={notification.id} className={`notification-item ${notification.read ? 'read' : ''}`}>
                  <span className="notification-icon">
                    {notification.type === 'alert' ? '⚠️' : '📬'}
                  </span>
                  <p>{notification.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showTransactionModal && (
        <TransactionModal
          type={transactionType}
          account={selectedAccount}
          accounts={accounts}
          token={token}
          onClose={() => setShowTransactionModal(false)}
          onComplete={handleTransactionComplete}
        />
      )}
    </div>
  );
}

export default Dashboard;
