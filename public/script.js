document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = "https://leaderboard-production-6462.up.railway.app";  // Corrected API URL

  const leaderboardContainers = {
    round1: document.querySelector('#leaderboard-round1 tbody'),
    round2: document.querySelector('#leaderboard-round2 tbody'),
    round3: document.querySelector('#leaderboard-round3 tbody')
  };

  let previousData = {}; // Store last known leaderboard state

  function loadLeaderboards() {
    fetch(`${API_BASE_URL}/leaderboard`)  // Use full API URL
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (JSON.stringify(data) === JSON.stringify(previousData)) return; // Skip update if no change
        previousData = data;

        Object.keys(leaderboardContainers).forEach(round => {
          const leaderboardBody = leaderboardContainers[round];
          leaderboardBody.innerHTML = ''; // Clear previous data

          if (!data[round] || data[round].length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="3" style="text-align:center; font-style:italic;">No data available for ${round.replace('round', 'Round ')} ☠️</td>`;
            leaderboardBody.appendChild(row);
            return;
          }

          data[round].forEach((entry, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${index + 1}</td><td>${entry.name}</td><td>${entry.score}</td>`;
            leaderboardBody.appendChild(row);
          });
        });
      })
      .catch(error => console.error('❌ Error loading leaderboard:', error));
  }

  document.getElementById('admin-login').addEventListener('click', () => {
    const password = prompt('Enter admin password:');
    fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
      credentials: 'include' // Ensure session persistence
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        window.location.href = '/admin.html'; // Ensure proper redirection
      } else {
        alert('Invalid Password, you scallywag! ☠️');
      }
    })
    .catch(error => console.error('❌ Error during login:', error));
  });

  loadLeaderboards(); // Load data on page load
  setInterval(loadLeaderboards, 5000); // Auto-refresh leaderboard every 5 seconds
});
