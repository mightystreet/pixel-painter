import fetch from 'node-fetch';

// Test the leaderboard API endpoint
async function testLeaderboard() {
  try {
    // First, login to get a token
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test', password: 'password123' })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.token) {
      console.error('No token received');
      return;
    }
    
    // Test the leaderboard endpoint
    const leaderboardResponse = await fetch('http://localhost:5000/api/leaderboard', {
      headers: { 
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const leaderboardData = await leaderboardResponse.json();
    console.log('Leaderboard data:', JSON.stringify(leaderboardData, null, 2));
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testLeaderboard();