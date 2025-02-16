document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = "https://leaderboard-production-6462.up.railway.app";

  const roundButtons = document.querySelectorAll('.round-btn');
  const logoutButton = document.getElementById('logout-btn');
  const addRowButtons = document.querySelectorAll('.add-row');
  const saveButtons = document.querySelectorAll('.save-btn');
  const spreadsheetTables = document.querySelectorAll('.spreadsheet-table');

  console.log("✅ admin.js loaded");

  let sessionExpired = false;

  // ✅ Fix: Keep Session Active
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

  // ✅ Fix: Save Data to Backend (Ensure Login Session is Active)
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
        return { name: inputs[0].value.trim(), score: parseInt(inputs[1].value) };
      });

      try {
        const response = await fetch(`${API_BASE_URL}/update-leaderboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ round: `round${round}`, data: leaderboardData }),
          credentials: 'include'
        });

        const result = await response.json();

        if (response.status === 403) {
          alert(result.error);
          window.location.href = '/';
          return;
        }

        alert(result.message);
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

  loadLeaderboards();
});
