document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = "https://leaderboard-production-6462.up.railway.app"; // ✅ Backend API URL

  const roundButtons = document.querySelectorAll('.round-btn');
  const logoutButton = document.getElementById('logout-btn');
  const addRowButtons = document.querySelectorAll('.add-row');
  const saveButtons = document.querySelectorAll('.save-btn');
  const spreadsheetTables = document.querySelectorAll('.spreadsheet-table');

  console.log("✅ admin.js loaded"); // ✅ Debug log

  // ✅ Ensure "Add Pirate" buttons exist
  if (addRowButtons.length === 0) {
    console.error("❌ No 'Add Pirate' buttons found!");
  }

  // ✅ Ensure "Save Round" buttons exist
  if (saveButtons.length === 0) {
    console.error("❌ No 'Save Round' buttons found!");
  }

  // ✅ Load leaderboard data
  async function loadLeaderboards() {
    console.log("🔄 Fetching leaderboard data...");
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard`, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const data = await response.json();
      console.log("✅ Leaderboard Data:", data);

      ['1', '2', '3'].forEach(round => {
        const tableBody = document.querySelector(`#admin-table-round${round} tbody`);
        if (!tableBody) {
          console.error(`❌ Table for round ${round} not found!`);
          return;
        }

        tableBody.innerHTML = `<tr><th>Pirate Name</th><th>Score</th><th>⚔️ Action</th></tr>`;
        if (!data[`round${round}`] || data[`round${round}`].length === 0) {
          tableBody.innerHTML += `<tr><td colspan="3" style="text-align:center;">☠️ No Pirates Yet ☠️</td></tr>`;
          return;
        }

        data[`round${round}`].forEach(entry => addRow(round, entry.name, entry.score));
      });

    } catch (error) {
      console.error("❌ Error loading leaderboard:", error);
    }
  }

  // ✅ Add a new row
  function addRow(round, name = '', score = '') {
    const tableBody = document.querySelector(`#admin-table-round${round} tbody`);
    if (!tableBody) {
      console.error(`❌ Table for round ${round} not found!`);
      return;
    }

    console.log(`➕ Adding pirate to Round ${round}`);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" value="${name || ''}" placeholder="Pirate Name" /></td>
      <td><input type="number" value="${score || ''}" placeholder="Score" min="0" /></td>
      <td><button class="delete-row">❌ Remove</button></td>
    `;

    row.querySelector('.delete-row').addEventListener('click', () => row.remove());
    tableBody.appendChild(row);
  }

  // ✅ Ensure "Add Pirate" button works
  addRowButtons.forEach(button => {
    button.addEventListener('click', () => {
      console.log("➕ Add Pirate button clicked");
      const round = button.dataset.round;
      addRow(round);
    });
  });

  // ✅ Save leaderboard data
  saveButtons.forEach(button => {
    button.addEventListener('click', async () => {
      console.log("💾 Save Round button clicked");
      const round = button.dataset.round;
      const rows = document.querySelectorAll(`#admin-table-round${round} tbody tr:not(:first-child)`);
      const leaderboardData = Array.from(rows).map(row => {
        const inputs = row.querySelectorAll('input');
        return { name: inputs[0]?.value.trim() || "Unknown Pirate", score: parseInt(inputs[1]?.value) || 0 };
      });

      console.log(`📤 Sending update for Round ${round}:`, leaderboardData);

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
        loadLeaderboards(); // ✅ Refresh leaderboard after saving
      } catch (error) {
        console.error("❌ Error updating leaderboard:", error);
      }
    });
  });

  // ✅ Logout function
  logoutButton.addEventListener('click', () => {
    console.log("🚪 Logging out...");
    fetch(`${API_BASE_URL}/logout`, { credentials: 'include' }).then(() => window.location.href = '/');
  });

  // ✅ Round switching logic
  roundButtons.forEach(button => {
    button.addEventListener('click', () => {
      console.log("🔄 Switching to round:", button.dataset.round);
      const round = button.dataset.round;
      spreadsheetTables.forEach(table => table.style.display = 'none');
      document.getElementById(`spreadsheet-round${round}`).style.display = 'block';
    });
  });

  loadLeaderboards(); // ✅ Load leaderboard on page load
  setInterval(loadLeaderboards, 5000); // ✅ Auto-refresh leaderboard every 5 seconds
});
