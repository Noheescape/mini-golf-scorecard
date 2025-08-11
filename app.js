// app.js

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-game");
  const viewStart = document.getElementById("view-start");
  const viewScorecard = document.getElementById("view-scorecard");
  const viewStats = document.getElementById("view-stats");
  const viewStatsBtn = document.getElementById("view-stats-button");
  const backToStartBtn = document.getElementById("back-to-start");
  const backToStartFromScorecardBtn = document.getElementById("back-to-start-from-scorecard");
  const scorecardTitle = document.getElementById("scorecard-title");
  const scorecardBody = document.getElementById("scorecard-body");
  const statsDiv = document.getElementById("stats-summary");
  const dropdown = document.getElementById("saved-games-dropdown");
  const detailsDiv = document.getElementById("saved-game-details");

  let players = [];
  let playerColors = [];

  // Load saved player colors
  const savedColors = JSON.parse(localStorage.getItem("playerColors") || "[]");
  for (let i = 1; i <= 4; i++) {
    if (savedColors[i - 1]) {
      const colorSelect = document.getElementById(`color${i}`);
      if (colorSelect) {
        colorSelect.value = savedColors[i - 1];
      }
    }
  }

  startBtn.addEventListener("click", () => {
    players = [];
    playerColors = [];

    for (let i = 1; i <= 4; i++) {
      const name = document.getElementById(`player${i}`).value.trim() || `Player ${i}`;
      const color = document.getElementById(`color${i}`).value || "gray";
      players.push(name);
      playerColors.push(color);
    }

    localStorage.setItem("playerColors", JSON.stringify(playerColors));

    const courseName = document.getElementById("course-name").value || "Unnamed Course";
    const gameDate = document.getElementById("game-date").value || new Date().toISOString().split("T")[0];

    viewStart.classList.add("hidden");
    viewScorecard.classList.remove("hidden");

    scorecardTitle.textContent = `${courseName} — ${gameDate}`;

    for (let i = 1; i <= 4; i++) {
      const header = document.getElementById(`player${i}-header`);
      header.innerHTML = `
        <span class="color-dot player-${playerColors[i - 1]}"></span> ${players[i - 1]}
      `;
    }

    buildScorecardRows();
  });

  viewStatsBtn.addEventListener("click", () => {
    viewStart.classList.add("hidden");
    viewScorecard.classList.add("hidden");
    viewStats.classList.remove("hidden");
    updateStatsView();
  });

  backToStartBtn.addEventListener("click", () => {
    viewStats.classList.add("hidden");
    viewStart.classList.remove("hidden");
  });

  backToStartFromScorecardBtn.addEventListener("click", () => {
    viewScorecard.classList.add("hidden");
    viewStart.classList.remove("hidden");
  });

  function buildScorecardRows() {
    scorecardBody.innerHTML = "";

    for (let hole = 1; hole <= 18; hole++) {
      const row = document.createElement("tr");

      const holeCell = document.createElement("td");
      holeCell.textContent = hole;
      row.appendChild(holeCell);

      const parCell = document.createElement("td");
      const parInput = document.createElement("input");
      parInput.type = "number";
      parInput.className = "score-input";
      parInput.dataset.hole = hole;
      parInput.dataset.col = "par";
      parInput.addEventListener("input", updateTotals);
      parCell.appendChild(parInput);
      row.appendChild(parCell);

      for (let i = 0; i < 4; i++) {
        const scoreCell = document.createElement("td");
        const scoreInput = document.createElement("input");
        scoreInput.type = "number";
        scoreInput.className = `score-input player-${playerColors[i]}`;
        scoreInput.dataset.hole = hole;
        scoreInput.dataset.col = i;
        scoreInput.addEventListener("input", updateTotals);
        scoreCell.appendChild(scoreInput);
        row.appendChild(scoreCell);
      }

      scorecardBody.appendChild(row);
    }
  }

  function updateTotals() {
    let totalPar = 0;
    const playerTotals = [0, 0, 0, 0];

    const inputs = document.querySelectorAll(".score-input");
    inputs.forEach(input => {
      const val = parseInt(input.value);
      if (isNaN(val)) return;
      const col = input.dataset.col;
      if (col === "par") {
        totalPar += val;
      } else {
        playerTotals[col] += val;
      }
    });

    document.getElementById("total-par").textContent = totalPar;

    for (let i = 0; i < 4; i++) {
      const cell = document.getElementById(`total-${i + 1}`);
      cell.textContent = playerTotals[i];
      cell.className = `player-${playerColors[i]}`;
    }

    saveGameIfComplete(playerTotals, totalPar);
  }

  function saveGameIfComplete(playerTotals, totalPar) {
    if (playerTotals.some(score => score === 0)) return;

    const game = {
      date: scorecardTitle.textContent,
      players,
      scores: [...playerTotals],
      par: totalPar,
      holes: getHoleScores()
    };

    const history = JSON.parse(localStorage.getItem("golfHistory") || "[]");
    history.push(game);
    localStorage.setItem("golfHistory", JSON.stringify(history));

    // Trophy for lowest score
    const minScore = Math.min(...playerTotals);
    for (let i = 0; i < 4; i++) {
      const cell = document.getElementById(`total-${i + 1}`);
      if (playerTotals[i] === minScore) {
        cell.textContent = `${playerTotals[i]} 🏆`;
      }
    }

    updateStatsView();
  }

  function getHoleScores() {
    const holeData = [];
    const rows = document.querySelectorAll("#scorecard-body tr");
    rows.forEach(row => {
      const inputs = row.querySelectorAll("input");
      const par = parseInt(inputs[0].value) || 0;
      const scores = Array.from(inputs).slice(1).map(inp => parseInt(inp.value) || 0);
      holeData.push({ par, scores });
    });
    return holeData;
  }

  function updateStatsView() {
    const history = JSON.parse(localStorage.getItem("golfHistory") || "[]");
    const stats = {};
    const savedColors = JSON.parse(localStorage.getItem("playerColors") || []);

    history.forEach(game => {
      game.players.forEach((name, i) => {
        if (!stats[name]) {
          stats[name] = { games: 0, totalScore: 0, wins: 0, holeInOnes: 0, color: savedColors[i] || "gray" };
        }
        stats[name].games++;
        stats[name].totalScore += game.scores[i];
        if (game.scores[i] === Math.min(...game.scores)) {
          stats[name].wins++;
        }
        game.holes.forEach(h => {
          if (h.scores[i] === 1) stats[name].holeInOnes++;
        });
      });
    });

    // Build stats table
    statsDiv.innerHTML = Object.entries(stats).map(([name, s]) => `
      <tr>
        <td><span class="color-dot player-${s.color}"></span>${name}</td>
        <td>${s.games}</td>
        <td>${(s.totalScore / s.games).toFixed(1)}</td>
        <td>${s.wins}</td>
        <td>${s.holeInOnes}</td>
      </tr>
    `).join("");

    // Populate dropdown
    dropdown.innerHTML = `<option value="">Select a saved game</option>`;
    history.forEach((game, index) => {
      dropdown.innerHTML += `<option value="${index}">${game.date}</option>`;
    });

    dropdown.onchange = () => {
      const selected = history[dropdown.value];
      if (!selected) return;

      const minScore = Math.min(...selected.scores);

      let tableHTML = `
        <h3>${selected.date}</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Hole</th>
                <th>Par</th>
                ${selected.players.map((name, i) => `
                  <th><span class="color-dot player-${savedColors[i] || "gray"}"></span>${name}</th>
                `).join("")}
              </tr>
            </thead>
            <tbody>
      `;

      selected.holes.forEach((hole, idx) => {
        tableHTML += `
          <tr>
            <td>${idx + 1}</td>
            <td>${hole.par}</td>
            ${hole.scores.map((score, i) => `
              <td class="player-${savedColors[i] || "gray"}">${score}</td>
            `).join("")}
          </tr>
        `;
      });

      tableHTML += `
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td>${selected.par}</td>
                ${selected.scores.map((score, i) => `
                  <td class="player-${savedColors[i] || "gray"}">
                    ${score}${score === minScore ? " 🏆" : ""}
                  </td>
                `).join("")}
              </tr>
            </tfoot>
          </table>
        </div>
      `;

      detailsDiv.innerHTML = tableHTML;
    };

    // ✅ Only add button listeners if elements exist
    const deleteBtn = document.getElementById("delete-game");
    if (deleteBtn) {
      deleteBtn.onclick = () => {
        const idx = parseInt(dropdown.value);
        if (isNaN(idx)) return;
        history.splice(idx, 1);
        localStorage.setItem("golfHistory", JSON.stringify(history));
        updateStatsView();
      };
    }

    const clearBtn = document.getElementById("clear-all-games");
    if (clearBtn) {
      clearBtn.onclick = () => {
        if (confirm("Are you sure you want to clear all saved games?")) {
          localStorage.removeItem("golfHistory");
          updateStatsView();
        }
      };
    }
  }
});
