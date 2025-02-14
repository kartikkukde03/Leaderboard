const API_BASE_URL = "https://leaderboard-production-6462.up.railway.app"; // Replace with your actual Railway API URL

const roundButtons = document.querySelectorAll('.round-btn');
const spreadsheetTables = document.querySelectorAll('.spreadsheet-table');
const saveButtons = document.querySelectorAll('.save-btn');
const logoutButton = document.getElementById('logout-btn');

// ✅ Switch between rounds
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
  const row = document.createElement('tr');

  row.innerHTML = `
    <td><input type="text" value="${name || 'Unknown Pirate'}" /></td>
    <td><input type="number" value="${score || 0}" /></td>
    <td><button class="delete-row">❌ Remove</button></td>
  `;

  row.querySelector('.delete-row').addEventListener('click', () => row.remove());
  table.appendChild(row);
}

// ✅ Fix: Save leaderboard for a specific round
saveButtons.forEach(button => {
  button.addEventListener('click', async () => {
    const round = button.dataset.round;
    const rows = document.querySelectorAll(`#admin-table-round${round} tr:not(:first-child)`);
    
    const leaderboardData = Array.from(rows).map(row => {
      const inputs = row.querySelectorAll('input');
      const name = inputs[0].value.trim() || "Unknown Pirate"; // ✅ No undefined names
      const score = parseInt(inputs[1].value) || 0; // ✅ No undefined scores
      return { name, score };
    });

    try {
      const response = await fetch(`${API_BASE_URL}/update-leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round: `round${round}`, data: leaderboardData }),
        credentials: 'include'
      });

      const data = await response.json();
      console.log("🔍 Debug Response:", data); // ✅ Log response for debugging

      if (data.message) {
        alert(data.message); // ✅ Fix: Ensure alert is not "undefined"
      } else {
        alert("❌ Unexpected response format. Check console.");
      }

      loadLeaderboards(); // ✅ Refresh leaderboard after save
    } catch (error) {
      console.error('❌ Error updating leaderboard:', error);
      alert("❌ Error saving data. Check console.");
    }
  });
});

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

// ✅ Logout
logoutButton.addEventListener('click', () => {
  fetch(`${API_BASE_URL}/logout`, { credentials: 'include' })
    .then(() => window.location.href = '/');
});

// ✅ Load leaderboard on page load
loadLeaderboards();
