document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = "https://leaderboard-production-6462.up.railway.app";

  const roundButtons = document.querySelectorAll('.round-btn');
  const logoutButton = document.getElementById('logout-btn');
  const addRowButtons = document.querySelectorAll('.add-row');
  const saveButtons = document.querySelectorAll('.save-btn');
  const spreadsheetTables = document.querySelectorAll('.spreadsheet-table');

  console.log("✅ admin.js loaded");

  // ✅ Fix: Define addRow() before calling it inside loadLeaderboards()
  function addRow(round, name = '', score = '', fromManualInput = true) {
    const tableBody = document.querySelector(`#admin-table-round${round} tbody`);
    if (!tableBody) return;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" value="${name}" placeholder="Pirate Name" /></td>
      <td><input type="number" value="${score}" placeholder="Score" min="0" /></td>
      <td><button class="delete-row">❌ Remove</button></td>
    `;

    row.querySelector('.delete-row').addEventListener('click', () => {
      row.remove();
    });

    tableBody.appendChild(row);
  }

  // ✅ Fix: Ensure loadLeaderboards() is declared AFTER addRow()
  async function loadLeaderboards() {
    console.log("🔄 Fetching leaderboard data...");
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard`, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const data = await response.json();
      console.log("✅ Leaderboard Data:", data);

      ['1', '2', '3'].forEach(round => {
        const tableBody = document.querySelector(`#admin-table-round${round} tbody`);
        if (!tableBody) return;

        tableBody.innerHTML = ''; // Clear previous entries

        if (!data[`round${round}`] || data[`round${round}`].length === 0) {
          tableBody.innerHTML = `<tr><td colspan="3">☠️ No Pirates Yet ☠️</td></tr>`;
        } else {
          data[`round${round}`].forEach(entry => addRow(round, entry.name, entry.score, false));
        }
      });

    } catch (error) {
      console.error("❌ Error loading leaderboard:", error);
    }
  }

  addRowButtons.forEach(button => {
    button.addEventListener('click', () => {
      const round = button.dataset.round;
      addRow(round);
    });
  });

  saveButtons.forEach(button => {
    button.addEventListener('click', async () => {
      console.log("💾 Save Round button clicked");
      const round = button.dataset.round;
      const rows = document.querySelectorAll(`#admin-table-round${round} tbody tr`);
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

        if (response.status === 403) {
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

  loadLeaderboards();
});
