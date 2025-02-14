document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = "https://leaderboard-production-6462.up.railway.app"; // Replace with actual API URL

  const roundButtons = document.querySelectorAll('.round-btn');
  const spreadsheetTables = document.querySelectorAll('.spreadsheet-table');
  const saveButtons = document.querySelectorAll('.save-btn');
  const logoutButton = document.getElementById('logout-btn');
  const addRowButtons = document.querySelectorAll('.add-row'); 

  // ✅ Fix: Ensure elements exist before adding event listeners
  if (!addRowButtons || addRowButtons.length === 0) {
    console.error("❌ No 'Add Pirate' buttons found!");
  } else {
    addRowButtons.forEach(button => {
      button.addEventListener('click', () => {
        const round = button.dataset.round;
        addRow(round);
      });
    });
  }

  // ✅ Fix: Ensure "Save Round" buttons exist
  if (!saveButtons || saveButtons.length === 0) {
    console.error("❌ No 'Save Round' buttons found!");
  } else {
    saveButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const round = button.dataset.round;
        const rows = document.querySelectorAll(`#admin-table-round${round} tr:not(:first-child)`);

        const leaderboardData = Array.from(rows).map(row => {
          const inputs = row.querySelectorAll('input');
          const name = inputs[0]?.value.trim() || "Unknown Pirate"; 
          const score = parseInt(inputs[1]?.value) || 0; 
          return { name, score };
        });

        try {
          const response = await fetch(`${API_BASE_URL}/update-leaderboard`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ round: `round${round}`, data: leaderboardData }),
            credentials: 'include' // ✅ Ensure session authentication works
          });

          console.log("🔍 Raw Response:", response);

          if (!response.ok) {
            if (response.status === 403) {
              alert("❌ Unauthorized: Admin session missing. Please log in again.");
              window.location.href = '/'; // Redirect to login page
              return;
            }
            throw new Error(`HTTP Error: ${response.status}`);
          }

          const data = await response.json();
          console.log("🔍 Debug Response:", data);

          if (data.message) {
            alert(data.message);
          } else {
            alert("❌ Unexpected response format. Check console.");
          }

          loadLeaderboards();
        } catch (error) {
          console.error('❌ Error updating leaderboard:', error);
          alert("❌ Error saving data. Check console.");
        }
      });
    });
  }

  // ✅ Fix: Ensure logout button exists
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      fetch(`${API_BASE_URL}/logout`, { credentials: 'include' })
        .then(() => window.location.href = '/');
    });
  } else {
    console.error("❌ Logout button not found!");
  }

  // ✅ Function to switch between rounds
  roundButtons.forEach(button => {
    button.addEventListener('click', () => {
      const round = button.dataset.round;
      spreadsheetTables.forEach(table => table.style.display = 'none'); // Hide all tables
      document.getElementById(`spreadsheet-round${round}`).style.display = 'block'; // Show selected round
    });
  });

  // ✅ Load leaderboard data
  function loadLeaderboards() {
    fetch(`${API_BASE_URL}/leaderboard`, { credentials: 'include' })
      .then(response => response.json())
      .then(data => {
        ['1', '2', '3'].forEach(round => {
          const table = document.getElementById(`admin-table-round${round}`);
          table.innerHTML = `<tr><th>Pirate Name</th><th>Score</th><th>⚔️ Action</th></tr>`;

          if (!data[`round${round}`] || data[`round${round}`].length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="3" style="text-align:center; font-style:italic;">No data available ☠️</td>`;
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

    if (!table) {
      console.error(`❌ Table for round ${round} not found!`);
      return;
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" value="${name || 'Unknown Pirate'}" /></td>
      <td><input type="number" value="${score || 0}" /></td>
      <td><button class="delete-row">❌ Remove</button></td>
    `;

    row.querySelector('.delete-row').addEventListener('click', () => row.remove());
    table.appendChild(row);
  }

  // ✅ Admin Login
  document.getElementById('admin-login').addEventListener('click', async () => {
    const password = prompt('Enter admin password:');

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include'
      });

      const data = await response.json();
      console.log("🔍 Login Debug Response:", data);

      if (data.success) {
        alert('✅ Login successful! Redirecting to admin panel...');
        window.location.href = '/admin.html';
      } else {
        alert(`❌ Login failed: ${data.message}`);
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
