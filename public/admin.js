document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = "https://leaderboard-production-6462.up.railway.app"; // ✅ Backend API URL

  const roundButtons = document.querySelectorAll('.round-btn');
  const logoutButton = document.getElementById('logout-btn');
  const addRowButtons = document.querySelectorAll('.add-row');
  const saveButtons = document.querySelectorAll('.save-btn');
  const spreadsheetTables = document.querySelectorAll('.spreadsheet-table');

  // ✅ Ensure admin session is active
  async function checkAdminSession() {
    try {
      const response = await fetch(`${API_BASE_URL}/check-session`, { credentials: 'include' });
      if (!response.ok) {
        alert("❌ Admin session expired. Please log in again.");
        window.location.href = '/';
      }
    } catch (error) {
      console.error("❌ Error checking session:", error);
    }
  }
  setInterval(checkAdminSession, 30000); // ✅ Check session every 30 seconds

  // ✅ Function to load leaderboard data
  async function loadLeaderboards() {
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard`, { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch leaderboard data");

      const data = await response.json();
      ['1', '2', '3'].forEach(round => {
        const tableBody = document.querySelector(`#admin-table-round${round} tbody`);
        tableBody.innerHTML = `<tr><th>Pirate Name</th><th>Score</th><th>⚔️ Action</th></tr>`;

        if (!data[`round${round}`] || data[`round${round}`].length === 0) {
          const row = document.createElement('tr');
          row.innerHTML = `<td colspan="3" style="text-align:center;">☠️ No Pirates Yet ☠️</td>`;
          tableBody.appendChild(row);
          return;
        }

        data[`round${round}`].forEach(entry => addRow(round, entry.name, entry.score));
      });
    } catch (error) {
      console.error("❌ Error loading leaderboard:", error);
    }
  }

  // ✅ Function to add a new row
  function addRow(round, name = '', score = '') {
    const tableBody = document.querySelector(`#admin-table-round${round} tbody`);
    if (!tableBody) return console.error(`❌ Table for round ${round} not found!`);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" value="${name || ''}" placeholder="Pirate Name" /></td>
      <td><input type="number" value="${score || ''}" placeholder="Score" min="0" /></td>
      <td><button class="delete-row">❌ Remove</button></td>
    `;

    row.querySelector('.delete-row').addEventListener('click', () => row.remove());
    tableBody.appendChild(row);
  }

  // ✅ Ensure "Add Pirate" button always works
  addRowButtons.forEach(button => {
    button.addEventListener('click', () => {
      const round = button.dataset.round;
      addRow(round);
    });
  });

  // ✅ Ensure "Save Round" updates leaderboard
  saveButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const round = button.dataset.round;
      const rows = document.querySelectorAll(`#admin-table-round${round} tbody tr:not(:first-child)`);
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
          window.location.href = '/';
          return;
        }

        alert("✅ Leaderboard updated successfully!");
        loadLeaderboards();
      } catch (error) {
        console.error("❌ Error updating leaderboard:", error);
      }
    });
  });

  // ✅ Logout function
  logoutButton.addEventListener('click', () => {
    fetch(`${API_BASE_URL}/logout`, { credentials: 'include' }).then(() => window.location.href = '/');
  });

  // ✅ Ensure round switching works
  roundButtons.forEach(button => {
    button.addEventListener('click', () => {
      const round = button.dataset.round;
      spreadsheetTables.forEach(table => table.style.display = 'none');
      document.getElementById(`spreadsheet-round${round}`).style.display = 'block';
    });
  });

  loadLeaderboards(); // ✅ Load leaderboard on page load
  setInterval(loadLeaderboards, 5000); // ✅ Auto-refresh leaderboard every 5 seconds
});
