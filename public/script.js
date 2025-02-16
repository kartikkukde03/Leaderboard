document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = "https://leaderboard-production-6462.up.railway.app";

  const leaderboardContainers = {
    round1: document.querySelector('#leaderboard-round1 tbody'),
    round2: document.querySelector('#leaderboard-round2 tbody'),
    round3: document.querySelector('#leaderboard-round3 tbody')
  };

  let previousData = {}; // ✅ Store last known leaderboard state
  let sessionExpired = false; // ✅ Track session expiry

  async function checkSession() {
    try {
      const response = await fetch(`${API_BASE_URL}/keep-alive`, { credentials: 'include' });
      const data = await response.json();
      if (!data.success) {
        sessionExpired = true;
        alert("❌ Session expired. Please log in again.");
        window.location.href = '/';
      }
    } catch (error) {
      console.error("❌ Failed to verify session:", error);
    }
  }
  setInterval(checkSession, 60000); // Check session every 60 seconds

  async function loadLeaderboards() {
    console.log("🔄 Fetching leaderboard data...");
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard`, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const data = await response.json();
      console.log("✅ Leaderboard Data:", data);

      // ✅ Prevents duplicate leaderboard updates
      if (JSON.stringify(data) === JSON.stringify(previousData)) return;
      previousData = data;

      Object.keys(leaderboardContainers).forEach(round => {
        const leaderboardBody = leaderboardContainers[round];
        leaderboardBody.innerHTML = ''; // ✅ Clears previous data

        if (!data[round] || data[round].length === 0) {
          const row = document.createElement('tr');
          row.innerHTML = `<td colspan="3" style="text-align:center; font-style:italic;">☠️ No Pirates Yet ☠️</td>`;
          leaderboardBody.appendChild(row);
          return;
        }

        // ✅ Add leaderboard entries dynamically
        data[round].forEach((entry, index) => {
          const row = document.createElement('tr');
          row.innerHTML = `<td>${index + 1}</td><td>${entry.name}</td><td>${entry.score}</td>`;
          leaderboardBody.appendChild(row);
        });
      });
    } catch (error) {
      console.error("❌ Error loading leaderboard:", error);
    }
  }

  // ✅ Admin Login
  document.getElementById('admin-login').addEventListener('click', async () => {
    const password = prompt('Enter admin password:');

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include' // ✅ Ensure session persistence
      });

      const data = await response.json();
      console.log("🔍 Login Debug Response:", data);

      if (data.success) {
        alert('✅ Login successful! Redirecting to admin panel...');
        window.location.href = '/admin.html'; // ✅ Ensure proper redirection
      } else {
        alert('❌ Invalid Password, you scallywag! ☠️');
      }
    } catch (error) {
      console.error('❌ Error during login:', error);
      alert('❌ An error occurred while logging in. Check the console.');
    }
  });

  // ✅ Auto-refresh leaderboard every 5 seconds
  setInterval(loadLeaderboards, 5000);

  // ✅ Load leaderboard on page load
  loadLeaderboards();
});
