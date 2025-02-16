document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = "https://leaderboard-production-6462.up.railway.app"; // ✅ Backend API URL

  const roundButtons = document.querySelectorAll('.round-btn');
  const logoutButton = document.getElementById('logout-btn');
  const addRowButtons = document.querySelectorAll('.add-row');
  const saveButtons = document.querySelectorAll('.save-btn');
  const spreadsheetTables = document.querySelectorAll('.spreadsheet-table');

  console.log("✅ admin.js loaded");

  // ✅ Store manually added pirates (Fixes automatic new entries issue)
  const addedPirates = { round1: [], round2: [], round3: [] };

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

        // ✅ Fix: Clear only row data, keeping headers intact
        tableBody.innerHTML = '';

        if (!data[`round${round}`] || data[`round${round}`].length === 0) {
          tableBody.innerHTML += `<tr><td colspan="3" style="text-align:center;">☠️ No Pirates Yet ☠️</td></tr>`;
        } else {
          data[`round${round}`].forEach(entry => addRow(round, entry.name, entry.score, false));
        }

        // ✅ Re-add manually added pirates after refresh
        addedPirates[`round${round}`].forEach(pirate => addRow(round, pirate.name, pirate.score, true));
      });

    } catch (error) {
      console.error("❌ Error loading leaderboard:", error);
    }
  }

  // ✅ Function to add a new row
  function addRow(round, name = '', score = '', fromManualInput = true) {
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

    row.querySelector('.delete-row').addEventListener('click', () => {
      row.remove();
      if (fromManualInput) {
        addedPirates[`round${round}`] = addedPirates[`round${round}`].filter(p => p.name !== name);
      }
    });

    tableBody.appendChild(row);

    // ✅ Store manually added pirate only if input is manual
    if (fromManualInput) {
      addedPirates[`round${round}`].push({ name, score });
    }
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
      const rows = document.querySelectorAll(`#admin-table-round${round} tbody tr`);
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
        loadLeaderboards();
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

  // ✅ Ensure round switching works
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
