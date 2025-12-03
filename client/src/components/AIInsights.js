import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AIInsights.css';

function AIInsights({ token }) {
  const [insights, setInsights] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
    fetchSystemHealth();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await axios.get('/agents/customer-assistant', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInsights(response.data);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await axios.get('/agents/system-health');
      setSystemHealth(response.data);
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="ai-insights-section">
      <div className="ai-header">
        <h3>
          <span className="ai-icon">🤖</span>
          AI-Powered Insights
        </h3>
        <span className="ai-badge">Beta</span>
      </div>

      <div className="insights-grid">
        {insights && (
          <div className="insight-card">
            <div className="insight-header">
              <span className="insight-icon">📊</span>
              <h4>Spending Analysis</h4>
            </div>
            <div className="insight-content">
              <div className="stat-grid">
                <div className="stat-box">
                  <p className="stat-label">Period</p>
                  <p className="stat-value">{insights.summary.period}</p>
                </div>
                <div className="stat-box">
                  <p className="stat-label">Total Deposited</p>
                  <p className="stat-value positive">${insights.summary.totalDeposited}</p>
                </div>
                <div className="stat-box">
                  <p className="stat-label">Total Spent</p>
                  <p className="stat-value negative">${insights.summary.totalSpent}</p>
                </div>
                <div className="stat-box">
                  <p className="stat-label">Net Change</p>
                  <p className="stat-value">${insights.summary.netChange}</p>
                </div>
              </div>
              <div className="recommendation">
                <span className="recommendation-icon">💡</span>
                <p>{insights.recommendation}</p>
              </div>
            </div>
          </div>
        )}

        {systemHealth && (
          <div className="insight-card">
            <div className="insight-header">
              <span className="insight-icon">🏥</span>
              <h4>System Health</h4>
            </div>
            <div className="insight-content">
              <div className={`health-status ${systemHealth.status}`}>
                <span className="status-dot"></span>
                <span className="status-text">
                  {systemHealth.status === 'healthy' ? 'All Systems Operational' : 'System Degraded'}
                </span>
              </div>
              <div className="health-metrics">
                <div className="metric">
                  <span className="metric-label">Database</span>
                  <span className={`metric-badge ${systemHealth.checks.database ? 'success' : 'error'}`}>
                    {systemHealth.checks.database ? '✓ Connected' : '✗ Disconnected'}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Response Time</span>
                  <span className="metric-badge success">
                    {systemHealth.checks.responseTime}ms
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Error Rate</span>
                  <span className="metric-badge success">
                    {systemHealth.checks.errorRate} errors/hr
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIInsights;
