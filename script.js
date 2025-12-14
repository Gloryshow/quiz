const quizEl = document.getElementById("quiz");
const categoryScreen = document.getElementById("category-screen");
const questionEl = document.getElementById("question");
const landingScreen = document.getElementById("landing-screen");
const quizContainer = document.getElementById("quiz-container");
const startGameBtn = document.getElementById("start-game");
const optionsEl = document.getElementById("options");
const nextBtn = document.getElementById("next");
const resultEl = document.getElementById("result");
const progressEl = document.getElementById("progress");
const timerEl = document.getElementById("timer");
const playerNameInput = document.getElementById("player-name");
const showLeaderboardBtn = document.getElementById("show-leaderboard");
const leaderboardScreen = document.getElementById("leaderboard-screen");
const leaderboardList = document.getElementById("leaderboard-list");
const closeLeaderboardBtn = document.getElementById("close-leaderboard");
const playerDisplay = document.getElementById("player-display");
const setUsernameBtn = document.getElementById("set-username");
const clearUsernameBtn = document.getElementById("clear-username");
const registeredUserDisplay = document.getElementById("registered-user-display");
const registerMsg = document.getElementById("register-msg");

let currentQuestionIndex = 0;
let score = 0;
let selectedQuestions = [];
let currentPlayer = 'Player';

// Timer state
let timerInterval = null;
let timeLeft = 10; // seconds per question

function startTimer() {
  stopTimer();
  timeLeft = 10;
  if (timerEl) timerEl.textContent = timeLeft;
  timerInterval = setInterval(() => {
    timeLeft -= 1;
    if (timerEl) timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      stopTimer();
      handleTimeUp();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function handleTimeUp() {
  const currentQuiz = selectedQuestions[currentQuestionIndex];
  const allOptions = optionsEl.querySelectorAll("button");
  allOptions.forEach(btn => {
    btn.disabled = true;
    if (currentQuiz && btn.textContent.includes(currentQuiz.answer)) btn.classList.add("btn-success");
  });
  // Auto-advance after short delay
  setTimeout(() => {
    currentQuestionIndex++;
    if(currentQuestionIndex < selectedQuestions.length) {
      loadQuestion();
    } else {
      showResult();
    }
  }, 1200);
}

// Generate a short guest id like Guest-xk3f
function generateGuestId() {
  return 'Guest-' + Math.random().toString(36).substring(2, 7);
}

// Map categories to Open Trivia DB IDs
const categoryMap = {
  "ICT": 18,       // Computers
  "Politics": 24,  // Politics
  "Football": 21,  // Sports
  "Science": 17,   // Science & Nature
  "Mathematics": 19,
  "Geography": 22,
  "History": 23,
  "Animals": 27
};


// Fetch questions from API
async function fetchQuestions(categoryId) {
  const res = await fetch(`https://opentdb.com/api.php?amount=10&category=${categoryId}&type=multiple`);
  const data = await res.json();
  // Remove duplicate questions by text
  const unique = [];
  const seen = new Set();
  for (const q of data.results) {
    const text = decodeHtml(q.question).trim();
    if (!seen.has(text)) {
      seen.add(text);
      unique.push(q);
    }
    if (unique.length === 3) break;
  }
  return unique.map(q => ({
    question: decodeHtml(q.question),
    options: shuffle([...q.incorrect_answers.map(a => decodeHtml(a)), decodeHtml(q.correct_answer)]),
    answer: decodeHtml(q.correct_answer)
  }));
}

// Shuffle array
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// Leaderboard persistence using localStorage
function getLeaderboard() {
  return JSON.parse(localStorage.getItem('leaderboard') || '{}');
}

function saveLeaderboard(lb) {
  localStorage.setItem('leaderboard', JSON.stringify(lb));
}

function addPointsToPlayer(name, points) {
  if (!name) return;
  const lb = getLeaderboard();
  lb[name] = (lb[name] || 0) + points;
  saveLeaderboard(lb);
}

function renderLeaderboard() {
  const lb = getLeaderboard();
  const entries = Object.entries(lb).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    leaderboardList.innerHTML = '<li class="list-group-item text-center text-muted">No entries yet</li>';
    return;
  }
  leaderboardList.innerHTML = entries.map((e, i) => `
    <li class="list-group-item d-flex justify-content-between align-items-center">
      <span>${i + 1}. <strong>${e[0]}</strong></span>
      <span class="badge bg-primary rounded-pill">${e[1]} pts</span>
    </li>
  `).join('');
}

// Decode HTML entities
function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

// Landing page handler
if (startGameBtn) {
  startGameBtn.addEventListener('click', () => {
    landingScreen.style.display = 'none';
    document.getElementById('category-screen').style.display = 'block';
    if (quizContainer) quizContainer.style.display = 'none';
  });
}

// Category selection with event delegation on #categories
const categoriesEl = document.getElementById('categories');
if (categoriesEl) {
  categoriesEl.addEventListener('click', async (e) => {
    const target = e.target.closest('.category-btn');
    if (target) {
      const category = target.dataset.category;
      // Require a registered username before starting
      const regUser = getRegisteredUser();
      if (!regUser) {
        showRegisterMessage('Please register a username before playing.', 'error');
        if (playerNameInput) playerNameInput.focus();
        return;
      }
      currentPlayer = regUser;
      if (playerDisplay) playerDisplay.textContent = `Player: ${currentPlayer}`;
      categoryScreen.style.display = "none";
      if (quizContainer) quizContainer.style.display = 'block';
      quizEl.style.display = "block";
      selectedQuestions = await fetchQuestions(categoryMap[category]);
      loadQuestion();
    }
  });
}

// Leaderboard button handlers
if (showLeaderboardBtn) {
  showLeaderboardBtn.addEventListener('click', () => {
    renderLeaderboard();
    categoryScreen.style.display = 'none';
    leaderboardScreen.style.display = 'block';
  });
}
if (closeLeaderboardBtn) {
  closeLeaderboardBtn.addEventListener('click', () => {
    leaderboardScreen.style.display = 'none';
    categoryScreen.style.display = 'block';
  });
}
// leaderboard reset removed to prevent players from clearing data

// Registered username persistence and UI
function getRegisteredUser() {
  return localStorage.getItem('registeredUser') || '';
}

function setRegisteredUser(name) {
  localStorage.setItem('registeredUser', name);
}

function clearRegisteredUser() {
  localStorage.removeItem('registeredUser');
}

// User registry to enforce unique usernames across players (localStorage)
function getUserRegistry() {
  return JSON.parse(localStorage.getItem('userRegistry') || '[]');
}

function saveUserRegistry(list) {
  localStorage.setItem('userRegistry', JSON.stringify(list));
}

// Inline message helper for registration feedback
let registerMsgTimeout = null;
function showRegisterMessage(msg, type = 'info') {
  if (!registerMsg) return;
  registerMsg.textContent = msg;
  registerMsg.classList.remove('alert-info', 'alert-danger', 'alert-success');
  registerMsg.classList.add('alert', `alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'}`);
  registerMsg.style.display = 'block';
  if (registerMsgTimeout) clearTimeout(registerMsgTimeout);
  registerMsgTimeout = setTimeout(() => {
    registerMsg.textContent = '';
    registerMsg.style.display = 'none';
  }, 4000);
}

// Populate registered user display on load
const existingRegistered = getRegisteredUser();
if (existingRegistered) {
  if (playerNameInput) playerNameInput.value = existingRegistered;
  if (registeredUserDisplay) { registeredUserDisplay.textContent = `✓ Registered: ${existingRegistered}`; registeredUserDisplay.style.display = 'block'; }
}

// Register username handler
if (setUsernameBtn) {
  setUsernameBtn.addEventListener('click', () => {
    const desired = (playerNameInput && playerNameInput.value.trim()) || '';
    if (!desired) { showRegisterMessage('Enter a username to register.', 'error'); if (playerNameInput) playerNameInput.focus(); return; }
    const lb = getLeaderboard();
    const registry = getUserRegistry();
    const currentReg = getRegisteredUser();
    if ((Object.prototype.hasOwnProperty.call(lb, desired) || registry.includes(desired)) && currentReg !== desired) {
      showRegisterMessage('Username taken. Choose another.', 'error');
      return;
    }
    // Add to registry if not present
    if (!registry.includes(desired)) {
      registry.push(desired);
      saveUserRegistry(registry);
    }
    setRegisteredUser(desired);
    if (registeredUserDisplay) { registeredUserDisplay.textContent = `✓ Registered: ${desired}`; registeredUserDisplay.style.display = 'block'; }
    showRegisterMessage('Username registered. It will be used automatically when you play.', 'success');
  });
}

// Clear registered username handler
if (clearUsernameBtn) {
  clearUsernameBtn.addEventListener('click', () => {
    clearRegisteredUser();
    if (playerNameInput) playerNameInput.value = '';
    if (registeredUserDisplay) registeredUserDisplay.style.display = 'none';
  });
}

// Load question
function loadQuestion() {
  nextBtn.disabled = true;
  const currentQuiz = selectedQuestions[currentQuestionIndex];
  questionEl.textContent = currentQuiz.question;
  optionsEl.innerHTML = "";
  progressEl.style.width = `${(currentQuestionIndex / selectedQuestions.length) * 100}%`;
  // reset and start per-question timer
  if (timerEl) timerEl.textContent = '10';
  startTimer();

  currentQuiz.options.forEach(option => {
    const btn = document.createElement("button");
    btn.className = "btn btn-outline-light text-start";
    btn.textContent = option;
    btn.addEventListener("click", () => selectOption(btn, currentQuiz.answer));
    optionsEl.appendChild(btn);
  });
}

// Select option
function selectOption(selectedBtn, correctAnswer) {
  stopTimer();
  const allOptions = optionsEl.querySelectorAll("button");
  allOptions.forEach(btn => {
    btn.disabled = true;
    if(btn.textContent === correctAnswer) btn.classList.add("btn-success");
  });
  if(selectedBtn.textContent !== correctAnswer) selectedBtn.classList.add("btn-danger");
  if(selectedBtn.textContent === correctAnswer) score++;
  // Auto-advance after short delay
  setTimeout(() => {
    currentQuestionIndex++;
    if(currentQuestionIndex < selectedQuestions.length) {
      loadQuestion();
    } else {
      showResult();
    }
  }, 1200);
}

// Next question
nextBtn.addEventListener("click", () => {
  stopTimer();
  currentQuestionIndex++;
  if(currentQuestionIndex < selectedQuestions.length) {
    loadQuestion();
  } else {
    showResult();
  }
});
// Show result (render into `resultEl` and keep quiz container intact)
function showResult() {
  stopTimer();
  // Award points according to score: 1 -> +1, 2 -> +2, 3 -> +30
  let pointsToAdd = 0;
  if (score === 1) pointsToAdd = 1;
  else if (score === 2) pointsToAdd = 2;
  else if (score === selectedQuestions.length) pointsToAdd = 30;

  if (resultEl) {
    resultEl.innerHTML = `
      <h3 class="mb-4">Quiz Completed!</h3>
      <p class="lead">Your score: ${score} / ${selectedQuestions.length}</p>
      <p class="lead">Points awarded: ${pointsToAdd}</p>
      <button id="restart-quiz" class="btn btn-primary btn-lg">Play Again</button>
    `;
    const restartBtn = document.getElementById("restart-quiz");
    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        currentQuestionIndex = 0;
        score = 0;
        selectedQuestions = [];
        resultEl.innerHTML = '';
        categoryScreen.style.display = 'block';
        quizContainer.style.display = 'none';
        landingScreen.style.display = 'none';
        playerNameInput.value = '';
        registeredUserDisplay.style.display = 'none';
        clearRegisteredUser();
      });
    }
  }

  // Update leaderboard with new score
  addPointsToPlayer(currentPlayer, pointsToAdd);

  // Show result overlay
  if (resultEl) {
    resultEl.scrollIntoView({ behavior: "smooth" });
  }
}

//# sourceMappingURL=script.js.map
