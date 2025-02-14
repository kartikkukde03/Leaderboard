const API_BASE_URL = "https://leaderboard-production-6462.up.railway.app";  // Replace with your actual Railway URL

const roundButtons = document.querySelectorAll('.round-btn');
const spreadsheetTables = document.querySelectorAll('.spreadsheet-table');
const saveButtons = document.querySelectorAll('.save-btn');
const logoutButton = document.getElementById('logout-btn');

// Function to switch between rounds
roundButtons.forEach(button => {
  button.addEventListener('click', () => {
    const round = button.dataset.round;
    spreadsheetTables.forEach(table => table.style.display = 'none'); // Hide all tables
    document.getElementById(`spreadsheet-round${round}`).style.display = 'block'; // Show selected round
  });
});

// Function to load leaderboard data
function loadLeaderboards() {
  fetch(`${API_BASE_URL}/leaderboard`, { credentials: 'include' }) // Ensure session persistence
    .then(response => response.json())
    .then(data => {
      ['1', '2', '3'].forEach(round => {
        const table = document.getElementById(`admin-table-round${round}`);
        table.innerHTML = `<tr><th>Pirate Name</th><th>Score</th><th>⚔️ Action</th></tr>`; // Reset table

        // ✅ Show "No data available ☠️" if no data exists
        if (!data[`round${round}`] || data[`round${round}`].length === 0) {
          const row = document.createElement('tr');
          row.innerHTML = `<td colspan="3" style="text-align:center; font-style:italic;">No data available ☠️</td>`;
          table.appendChild(row);
          return;
        }

        // Populate table with leaderboard data
        data[`round${round}`].forEach(entry => addRow(round, entry.name, entry.score));
      });
    })
    .catch(error => console.error('Error loading leaderboard:', error));
}

// Function to add a new row in a specific round
function addRow(round, name = '', score = '') {
  const table = document.getElementById(`admin-table-round${round}`);
  const row = document.createElement('tr');

  row.innerHTML = `
    <td><input type="text" value="${name}" /></td>
    <td><input type="number" value="${score}" /></td>
    <td><button class="delete-row">❌ Remove</button></td>
  `;

  row.querySelector('.delete-row').addEventListener('click', () => row.remove());
  table.appendChild(row);
}

// Add event listeners to "Add Pirate" buttons
document.querySelectorAll('.add-row').forEach(button => {
  button.addEventListener('click', () => {
    const round = button.dataset.round;
    addRow(round);
  });
});

// Save leaderboard for a specific round
saveButtons.forEach(button => {
  button.addEventListener('click', () => {
    const round = button.dataset.round;
    const rows = document.querySelectorAll(`#admin-table-round${round} tr:not(:first-child)`);
    const leaderboardData = Array.from(rows).map(row => {
      const inputs = row.querySelectorAll('input');
      return { name: inputs[0].value.trim(), score: parseInt(inputs[1].value) || 0 };
    });

    fetch(`${API_BASE_URL}/update-leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ round: `round${round}`, data: leaderboardData }),
      credentials: 'include' // Ensure session persistence
    })
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(error => console.error('Error updating leaderboard:', error));
  });
});

// Admin Login
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
      alert('Login successful! Redirecting to admin panel...');
      window.location.href = '/admin.html'; // Redirect to admin panel
    } else {
      alert(`Login failed: ${data.message}`);
    }
  })
  .catch(error => console.error('❌ Error during login:', error));
});


// Logout function
logoutButton.addEventListener('click', () => {
  fetch(`${API_BASE_URL}/logout`, { credentials: 'include' })
    .then(() => window.location.href = '/');
});

// Load leaderboards on page load
loadLeaderboards();
