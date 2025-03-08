document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = "https://leaderboard-production-6462.up.railway.app";

  // Add default headers configuration
  const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const roundButtons = document.querySelectorAll('.round-btn');
  const logoutButton = document.getElementById('logout-btn');
  const addRowButtons = document.querySelectorAll('.add-row');
  const saveButtons = document.querySelectorAll('.save-btn');
  const spreadsheetTables = document.querySelectorAll('.spreadsheet-table');
  let sessionExpired = false; // Track session expiry

  // Initialize session check
  checkSession().then(isValid => {
    if (!isValid) {
      console.log("❌ No valid session found on load");
      window.location.href = '/';
    } else {
      console.log("✅ Initial session check passed");
    }
  });

  async function checkSession() {
    console.log("🔍 Checking session status...");
    try {
      const response = await fetch(`${API_BASE_URL}/keep-alive`, { 
        credentials: 'include',
        headers: DEFAULT_HEADERS,
        mode: 'cors'
      });
      
      console.log("🔍 Session check response status:", response.status);
      
      if (!response.ok) {
        console.error("❌ Session check failed:", response.status);
        sessionExpired = true;
        if (response.status === 403) {
          console.log("❌ Session expired or unauthorized");
          alert("❌ Session expired. Please log in again.");
          window.location.href = '/';
          return false;
        }
        return false;
      }
      
      const data = await response.json();
      console.log("✅ Session check response:", data);
      return data.success;
    } catch (error) {
      console.error("❌ Failed to verify session:", error);
      return false;
    }
  }
  
  // Reduced interval to 30 seconds to catch session issues earlier
  setInterval(checkSession, 30000);

  async function loginAdmin() {
    const password = prompt('Enter admin password:');
    if (!password) {
      alert('❌ Password is required');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ password }),
        credentials: 'include',
        mode: 'cors'
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log("✅ Login successful");
        alert('✅ Login successful! Redirecting to admin panel...');
        sessionExpired = false;
        window.location.href = '/admin.html';
      } else {
        console.error("❌ Login failed:", data);
        alert(data.message || '❌ Invalid Password');
      }
    } catch (error) {
      console.error('❌ Login Error:', error);
      alert('❌ Login failed. Please try again.');
    }
  }

  async function loadLeaderboards() {
    console.log("🔄 Fetching leaderboard data...");
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard`, { 
        credentials: 'include',
        headers: DEFAULT_HEADERS
      });
      if (!response.ok) {
        if (response.status === 403) {
          sessionExpired = true;
          alert("❌ Session expired. Please log in again.");
          window.location.href = '/';
          return;
        }
        throw new Error(`HTTP Error: ${response.status}`);
      }
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
      const round = button.dataset.round;
      addRow(round);
    });
  });

  saveButtons.forEach(button => {
    button.addEventListener('click', async () => {
      // Check session immediately before saving
      const isSessionValid = await checkSession();
      if (!isSessionValid) {
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
          headers: DEFAULT_HEADERS,
          body: JSON.stringify({ round: `round${round}`, data: leaderboardData }),
          credentials: 'include'
        });
  
        if (!response.ok) {
          const result = await response.json();
          console.error("❌ Error updating leaderboard:", result);
          if (response.status === 403) {
            alert("❌ Session expired. Please log in again.");
            window.location.href = '/';
            return;
          }
          alert(`❌ Error: ${result.error || "Unknown error"}`);
          return;
        }
  
        const result = await response.json();
        console.log("✅ Leaderboard updated successfully:", result);
        alert("✅ Leaderboard updated successfully!");
        loadLeaderboards();
      } catch (error) {
        console.error("❌ Error updating leaderboard:", error);
        alert("❌ Failed to update leaderboard. Please try again.");
      }
    });
  });

  logoutButton.addEventListener('click', async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/logout`, { 
        credentials: 'include',
        headers: DEFAULT_HEADERS
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Logout Error:', error);
      // Still redirect to home page even if logout fails
      window.location.href = '/';
    }
  });

  roundButtons.forEach(button => {
    button.addEventListener('click', () => {
      const round = button.dataset.round;
      spreadsheetTables.forEach(table => table.style.display = 'none');
      document.getElementById(`spreadsheet-round${round}`).style.display = 'block';
    });
  });

  loadLeaderboards();
});
