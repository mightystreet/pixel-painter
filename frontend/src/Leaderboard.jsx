import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

/**
 * Leaderboard Component - Displays top users and their statistics
 * Shows rankings based on pixels placed, contributions, and other metrics
 */
const Leaderboard = ({ token, refreshTrigger }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('pixels'); // Only 'pixels' now

  /**
   * Fetch leaderboard data from backend
   */
  const fetchLeaderboard = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/leaderboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('Please log in to view leaderboard');
        } else if (response.status === 403) {
          throw new Error('Session expired, please log in again');
        } else {
          throw new Error(errorData.error || `Failed to fetch leaderboard data (${response.status})`);
        }
      }
      
      const data = await response.json();
      setLeaderboardData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and token change
  useEffect(() => {
    if (token) {
      fetchLeaderboard();
      // Refresh every 30 seconds
      const interval = setInterval(fetchLeaderboard, 30000);
      return () => clearInterval(interval);
    } else {
      // Clear data and reset states when no token
      setLeaderboardData([]);
      setLoading(false);
      setError(null);
    }
  }, [token]);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (token && refreshTrigger) {
      fetchLeaderboard();
    }
  }, [refreshTrigger, token]);

  /**
   * Get medal emoji for top positions
   */
  const getMedal = (position) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${position}`;
    }
  };

  /**
   * Format large numbers with commas
   */
  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  /**
   * Get sorted data - only pixels now
   */
  const getSortedData = () => {
    if (!leaderboardData.length) return [];
    
    return [...leaderboardData].sort((a, b) => (b.pixelsPlaced || 0) - (a.pixelsPlaced || 0));
  };

  if (!token) {
    return (
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <h2>🏆 Leaderboard</h2>
        </div>
        <div className="error">
          <p>🔒 Please log in to view the leaderboard</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <h2>🏆 Leaderboard</h2>
        </div>
        <div className="loading">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <h2>🏆 Leaderboard</h2>
        </div>
        <div className="error">
          <p>Failed to load leaderboard: {error}</p>
          <button onClick={fetchLeaderboard} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sortedData = getSortedData();

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2>🏆 Leaderboard</h2>
        <button onClick={fetchLeaderboard} className="refresh-button" title="Refresh">
          🔄
        </button>
      </div>

      {/* Single tab - Pixels only */}
      <div className="leaderboard-tabs">
        <button className="tab active">
          🎨 Pixels
        </button>
      </div>

      {/* Leaderboard Content */}
      <div className="leaderboard-content">
        {sortedData.length === 0 ? (
          <div className="empty-state">
            <p>No users found. Start placing pixels to appear on the leaderboard!</p>
          </div>
        ) : (
          <div className="leaderboard-list">
            {sortedData.slice(0, 100).map((user, index) => (
              <div key={user.username} className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}>
                <div className="rank">
                  {getMedal(index + 1)}
                </div>
                
                <div className="user-info">
                  <div className="username">{user.username}</div>
                  <div className="user-stats">
                    <span className="stat-label">Pixels:</span>
                    <span className="stat-value">{formatNumber(user.pixelsPlaced)}</span>
                  </div>
                </div>

                {/* User Badge/Status */}
                <div className="user-badge">
                  {user.isOnline && <span className="online-indicator">🟢</span>}
                  {index === 0 && <span className="crown">👑</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="leaderboard-footer">
        <div className="global-stats">
          <span>Total Users: {leaderboardData.length}</span>
          <span>•</span>
          <span>Total Pixels: {formatNumber(leaderboardData.reduce((sum, user) => sum + (user.pixelsPlaced || 0), 0))}</span>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;