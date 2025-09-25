// Simple test without external dependencies
async function testAPI() {
  // Test login
  console.log('Testing login...');
  const response = await fetch('http://localhost:5000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'test', password: 'password123' })
  });
  
  if (!response.ok) {
    console.error('Login failed:', response.status);
    return;
  }
  
  const data = await response.json();
  console.log('Login successful, token:', data.token?.substring(0, 20) + '...');
  
  // Test leaderboard
  console.log('\nTesting leaderboard...');
  const leaderboardResponse = await fetch('http://localhost:5000/api/leaderboard', {
    headers: { 
      'Authorization': `Bearer ${data.token}`
    }
  });
  
  if (!leaderboardResponse.ok) {
    console.error('Leaderboard failed:', leaderboardResponse.status);
    const errorText = await leaderboardResponse.text();
    console.error('Error:', errorText);
    return;
  }
  
  const leaderboard = await leaderboardResponse.json();
  console.log('Leaderboard data:', JSON.stringify(leaderboard, null, 2));
}

// Run the test
testAPI().catch(console.error);