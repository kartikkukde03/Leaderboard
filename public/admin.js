document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = "https://leaderboard-production-6462.up.railway.app";

  const roundButtons = document.querySelectorAll('.round-btn');
  const logoutButton = document.getElementById('logout-btn');
  const addRowButtons = document.querySelectorAll('.add-row');
  const saveButtons = document.querySelectorAll('.save-btn');
  const spreadsheetTables = document.querySelectorAll('.spreadsheet-table');

  console.log("✅ admin.js loaded");

  let sessionExpired = false;

  // ✅ Function to Keep Session Active
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
  setInterval(checkSession, 60000); // Refresh session every 60 seconds

  // ✅ Load leaderboard data without duplicate headers
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

        tableBody.innerHTML = '';

        if (!data[`round${round}`] || data[`round${round}`].length === 0) {
          tableBody.innerHTML += `<tr><td colspan="3">☠️ No Pirates Yet ☠️</td></tr>`;
        } else {
          data[`round${round}`].forEach(entry => addRow(round, entry.name, entry.score, false));
        }
      });

    } catch (error) {
      console.error("❌ Error loading leaderboard:", error);
    }
  }

  // ✅ Ensure "Add Pirate" button works correctly
  function addRow(round, name = '', score = '', manualInput = true) {
    const tableBody = document.querySelector(`#admin-table-round${round} tbody`);
    if (!tableBody) return;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" value="${name}" placeholder="Pirate Name" /></td>
      <td><input type="number" value="${score}" placeholder="Score" min="0" /></td>
      <td><button class="delete-row">❌ Remove</button></td>
    `;

    row.querySelector('.delete-row').addEventListener('click', () => row.remove());

    tableBody.appendChild(row);
  }

  addRowButtons.forEach(button => {
    button.addEventListener('click', () => {
      console.log("➕ Add Pirate button clicked");
      const round = button.dataset.round;
      addRow(round);
    });
  });

  saveButtons.forEach(button => {
    button.addEventListener('click', async () => {
      console.log("💾 Save Round button clicked");

      if (sessionExpired) {
        alert("❌ Session expired. Please log in again.");
        window.location.href = '/';
        return;
      }

      const round = button.dataset.round;
      const rows = document.querySelectorAll(`#admin-table-round${round} tbody tr`);
      const leaderboardData = Array.from(rows).map(row => {
        const inputs = row.querySelectorAll('input');
        return { name: inputs[0].value.trim(), score: parseInt(inputs[1].value) || 0 };
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
          sessionExpired = true;
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

  loadLeaderboards();
});
