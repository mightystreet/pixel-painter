import React, { useState, useEffect } from 'react';

/**
 * Real-time Activity Statistics Component
 * Fetches and displays live activity data from the backend
 */
const ActivityStats = ({ token, refreshTrigger }) => {
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch activity data from backend
   */
  const fetchActivityData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/activity', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('Please log in to view activity data');
        } else if (response.status === 403) {
          throw new Error('Session expired, please log in again');
        } else {
          throw new Error(errorData.error || `Failed to fetch activity data (${response.status})`);
        }
      }
      
      const data = await response.json();
      setActivityData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Activity fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and token change
  useEffect(() => {
    if (token) {
      fetchActivityData();
      // Refresh every 10 seconds for real-time updates
      const interval = setInterval(fetchActivityData, 10000);
      return () => clearInterval(interval);
    } else {
      // Clear data and reset states when no token
      setActivityData(null);
      setLoading(false);
      setError(null);
    }
  }, [token]);

  // Refresh when refreshTrigger changes (when pixels are placed)
  useEffect(() => {
    if (token && refreshTrigger) {
      fetchActivityData();
    }
  }, [refreshTrigger, token]);

  if (!token) {
    return (
      <div className="activity-stats-empty">
        <span>🔒 Please log in to view activity statistics</span>
      </div>
    );
  }

  if (loading && !activityData) {
    return (
      <div className="activity-stats-loading">
        <div className="loading-spinner">🔄</div>
        <span>Loading activity...</span>
      </div>
    );
  }

  if (error && !activityData) {
    return (
      <div className="activity-stats-error">
        <span>❌ {error}</span>
      </div>
    );
  }

  if (!activityData) {
    return <div className="activity-stats-empty">No data available</div>;
  }

  const formatNumber = (num) => {
    if (typeof num === 'number') {
      return num.toLocaleString();
    }
    return String(num);
  };

  const formatRank = (rank) => {
    if (rank === 'N/A' || rank === 0) return 'Unranked';
    return `#${rank}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'No activity yet') return dateStr;
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString();
    } catch {
      return dateStr;
    }
  };

  const stats = [
    { 
      label: 'Total Pixels', 
      value: formatNumber(activityData.totalPixels),
      icon: '🎨',
      color: 'rgb(52, 152, 219)'
    },
    { 
      label: 'Online Users', 
      value: formatNumber(activityData.onlineUsers),
      icon: '👥',
      color: 'rgb(46, 204, 113)'
    },
    { 
      label: 'Your Pixels', 
      value: formatNumber(activityData.yourPixels),
      icon: '✨',
      color: 'rgb(155, 89, 182)'
    },
    { 
      label: 'Your Rank', 
      value: formatRank(activityData.yourRank),
      icon: '🏆',
      color: 'rgb(230, 126, 34)'
    },
    { 
      label: 'Total Users', 
      value: formatNumber(activityData.totalUsers),
      icon: '👤',
      color: 'rgb(52, 73, 94)'
    }
  ];

  return (
    <div className="activity-stats-container">
      {stats.map((stat, index) => (
        <div key={index} className="activity-stat-item">
          <div className="stat-icon" style={{ color: stat.color }}>
            {stat.icon}
          </div>
          <div className="stat-content">
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        </div>
      ))}
      
      {loading && (
        <div className="activity-refresh-indicator">
          <span className="refresh-icon">🔄</span>
          <span>Updating...</span>
        </div>
      )}
    </div>
  );
};

export default ActivityStats;