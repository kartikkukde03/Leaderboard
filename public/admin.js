document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = "https://leaderboard-production-6462.up.railway.app"; // Replace with actual API URL

  const roundButtons = document.querySelectorAll('.round-btn');
  const saveButtons = document.querySelectorAll('.save-btn');
  const logoutButton = document.getElementById('logout-btn');
  const addRowButtons = document.querySelectorAll('.add-row');
  
  // ✅ Function to check admin session (Auto-redirect if expired)
  async function checkAdminSession() {
    try {
      const response = await fetch(`${API_BASE_URL}/check-session`, { credentials: 'include' });
      if (!response.ok) {
        alert("❌ Session expired. Please log in again.");
        window.location.href = '/';
      }
    } catch (error) {
      console.error("❌ Error checking session:", error);
    }
  }
  
  setInterval(checkAdminSession, 30000); // Check session every 30 seconds

  // ✅ Function to load leaderboard data
  function loadLeaderboards() {
    fetch(`${API_BASE_URL}/leaderboard`, { credentials: 'include' })
      .then(response => response.json())
      .then(data => {
        ['1', '2', '3'].forEach(round => {
          const table = document.getElementById(`admin-table-round${round}`);
          table.innerHTML = `<tr><th>Pirate Name</th><th>Score</th><th>⚔️ Action</th></tr>`;

          if (!data[`round${round}`] || data[`round${round}`].length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="3">No data available ☠️</td>`;
            table.appendChild(row);
            return;
          }

          data[`round${round}`].forEach(entry => addRow(round, entry.name, entry.score));
        });
      })
      .catch(error => console.error('❌ Error loading leaderboard:', error));
  }

  // ✅ Function to add a new row
  function addRow(round, name = '', score = '') {
    const table = document.getElementById(`admin-table-round${round}`);
    if (!table) return console.error(`❌ Table for round ${round} not found!`);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" value="${name || 'Unknown Pirate'}" /></td>
      <td><input type="number" value="${score || 0}" /></td>
      <td><button class="delete-row">❌ Remove</button></td>
    `;

    row.querySelector('.delete-row').addEventListener('click', () => row.remove());
    table.appendChild(row);
  }

  // ✅ Attach event listeners to "Add Pirate" buttons
  addRowButtons.forEach(button => {
    button.addEventListener('click', () => {
      const round = button.dataset.round;
      addRow(round);
    });
  });

  // ✅ Save leaderboard for a specific round
  saveButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const round = button.dataset.round;
      const rows = document.querySelectorAll(`#admin-table-round${round} tr:not(:first-child)`);
      const leaderboardData = Array.from(rows).map(row => {
        const inputs = row.querySelectorAll('input');
        return { name: inputs[0]?.value.trim() || "Unknown Pirate", score: parseInt(inputs[1]?.value) || 0 };
      });

      try {
        const response = await fetch(`${API_BASE_URL}/update-leaderboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ round: `round${round}`, data: leaderboardData }),
          credentials: 'include'
        });

        if (!response.ok) {
          alert("❌ Unauthorized. Please log in again.");
          return window.location.href = '/';
        }

        alert("✅ Leaderboard updated successfully!");
        loadLeaderboards();
      } catch (error) {
        console.error('❌ Error updating leaderboard:', error);
      }
    });
  });

  // ✅ Logout function
  logoutButton.addEventListener('click', () => {
    fetch(`${API_BASE_URL}/logout`, { credentials: 'include' }).then(() => window.location.href = '/');
  });

  // ✅ Function to switch between rounds
  roundButtons.forEach(button => {
    button.addEventListener('click', () => {
      const round = button.dataset.round;
      document.querySelectorAll('.spreadsheet-table').forEach(table => table.style.display = 'none');
      document.getElementById(`spreadsheet-round${round}`).style.display = 'block';
    });
  });

  loadLeaderboards();
  setInterval(loadLeaderboards, 5000); // Auto-refresh leaderboard every 5 seconds
});
