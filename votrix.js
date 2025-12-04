// ---------------------------
// STORAGE HELPERS
// ---------------------------
function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

// ---------------------------
// GLOBALS
// ---------------------------
let currentUser = null;
let activePoll = null;

// ---------------------------
// REGISTRATION (Leader + Voter)
// ---------------------------
function registerUser(type) {
  const name = document.getElementById(type + "_name").value;
  const age = document.getElementById(type + "_age").value;
  const phone = document.getElementById(type + "_phone").value;
  const team = type === "leader" ? document.getElementById("leader_team").value : null;

  if (!name || !age || !phone || (type === "leader" && !team)) {
    alert("Please fill all fields.");
    return;
  }

  let users = getData(type + "s");

  // prevent duplicates
  if (users.some(u => u.phone === phone)) {
    alert("User already exists with this phone number.");
    return;
  }

  users.push({
    name,
    age,
    phone,
    team,
    type
  });

  saveData(type + "s", users);

  alert("Registration Successful!");
}

// ---------------------------
// LOGIN
// ---------------------------
function login(type) {
  const phone = document.getElementById(type + "_login_phone").value;

  let users = getData(type + "s");
  let user = users.find(u => u.phone === phone);

  if (!user) {
    alert("No user found with this phone number.");
    return;
  }

  currentUser = user;

  // show dashboards
  if (type === "leader") {
    document.getElementById("leaderDashboard").style.display = "block";
    document.getElementById("voterDashboard").style.display = "none";
  } else {
    document.getElementById("voterDashboard").style.display = "block";
    document.getElementById("leaderDashboard").style.display = "none";
  }

  alert("Login successful!");
}

// ---------------------------
// CREATE POLL (Leader)
// ---------------------------
function createPoll() {
  const start = document.getElementById("poll_start").value;
  const duration = 12; // fixed 12 hours

  if (!start) {
    alert("Choose start date & time!");
    return;
  }

  let leaders = getData("leaders");

  activePoll = {
    startTime: new Date(start).getTime(),
    endTime: new Date(start).getTime() + (duration * 60 * 60 * 1000),
    teams: leaders.map(l => ({ team: l.team, votes: 0 })),
    votedPhones: []
  };

  saveData("activePoll", activePoll);

  alert("Poll created! It will auto-start at scheduled time.");
}

// ---------------------------
// AUTO POLL START CHECK
// ---------------------------
function checkPollStatus() {
  activePoll = getData("activePoll");

  if (!activePoll.startTime) return;

  const now = Date.now();

  if (now >= activePoll.startTime && now <= activePoll.endTime) {
    document.getElementById("votingSection").style.display = "block";
    showSMS("Poll is LIVE! Voters can now vote.");
  }
  else if (now > activePoll.endTime) {
    endPoll();
  }
}

// ---------------------------
// DISPLAY TEAMS FOR VOTING
// ---------------------------
function loadTeamsForVoting() {
  activePoll = getData("activePoll");
  const box = document.getElementById("teamList");

  box.innerHTML = "";

  activePoll.teams.forEach((t, index) => {
    box.innerHTML += `
      <button onclick="castVote(${index})" class="vote-btn">${t.team}</button>
    `;
  });
}

// ---------------------------
// CAST VOTE (Anonymous)
// ---------------------------
function castVote(index) {
  activePoll = getData("activePoll");

  if (activePoll.votedPhones.includes(currentUser.phone)) {
    alert("You already voted.");
    return;
  }

  activePoll.teams[index].votes += 1;
  activePoll.votedPhones.push(currentUser.phone);

  saveData("activePoll", activePoll);

  alert("Vote recorded anonymously!");
}

// ---------------------------
// END POLL & ANNOUNCE WINNER
// ---------------------------
function endPoll() {
  activePoll = getData("activePoll");
  if (!activePoll.teams) return;

  const winner = activePoll.teams.reduce((a, b) => a.votes > b.votes ? a : b);

  showSMS("Winner: " + winner.team);

  // Notify leader
  let leaders = getData("leaders");
  let leader = leaders.find(l => l.team === winner.team);
  showSMS(`Congratulations ${leader.name}! Your team '${winner.team}' won!`);

  // Notify voters
  let voters = getData("voters");
  voters.forEach(v => {
    showSMS(`Dear voter, the winning team is '${winner.team}'.`);
  });

  alert("Poll Ended. Winner: " + winner.team);

  localStorage.removeItem("activePoll");
}

// ---------------------------
// SIMULATED SMS LOG
// ---------------------------
function showSMS(msg) {
  const log = document.getElementById("smsLog");
  log.innerHTML += `<p>📩 ${msg}</p>`;
}

// Run every 5 seconds
setInterval(checkPollStatus, 5000);
