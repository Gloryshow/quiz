// DOM Elements
const categoryScreen = document.getElementById('category-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const leaderboardScreen = document.getElementById('leaderboard-screen');
const rulesScreen = document.getElementById('rules-screen');

const playerNameInput = document.getElementById('player-name');
const setUsernameBtn = document.getElementById('set-username');
const clearUsernameBtn = document.getElementById('clear-username');
const registeredUserDisplay = document.getElementById('registered-user-display');
const registerMsg = document.getElementById('register-msg');

const categoryItems = document.querySelectorAll('.category-item');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const closeLeaderboardBtn = document.getElementById('close-leaderboard');
const leaderboardBackBtn = document.getElementById('leaderboard-back-btn');
const rulesBtn = document.getElementById('rules-btn');
const closeRulesBtn = document.getElementById('close-rules');
const rulesBackBtn = document.getElementById('rules-back-btn');

const questionEl = document.getElementById('question');
const questionNumberEl = document.getElementById('question-number');
const optionsEl = document.getElementById('options');
const quizCategoryEl = document.getElementById('quiz-category');
const quizTimerEl = document.getElementById('quiz-timer');
const progressFillEl = document.getElementById('progress-fill');
const nextBtn = document.getElementById('next');
const closeQuizBtn = document.getElementById('close-quiz');

const scorePercentageEl = document.getElementById('score-percentage');
const resultDetailTextEl = document.getElementById('result-detail-text');
const shareBtn = document.getElementById('share-btn');
const retakeBtn = document.getElementById('retake-btn');
const backHomeBtn = document.getElementById('back-home-btn');

const questionsDoneEl = document.getElementById('questions-done');
const coinsBalanceEl = document.getElementById('coins-balance');

// State
let currentQuestionIndex = 0;
let score = 0;
let selectedQuestions = [];
let currentPlayer = '';
let currentCategory = '';
let timerInterval = null;
let timeLeft = 15; // 15 seconds per question

// Category Map
const categoryMap = {
  "ICT": 18,
  "Politics": 24,
  "Football": 21,
  "Science": 17,
  "Mathematics": 19,
  "Geography": 22,
  "History": 23,
  "Animals": 27
};

// Utility Functions
function getRegisteredUser() {
  return localStorage.getItem('registeredUser') || '';
}

function setRegisteredUser(name) {
  localStorage.setItem('registeredUser', name);
}

function getCoins() {
  return parseInt(localStorage.getItem('coins') || '0', 10);
}

function addCoins(amount) {
  const current = getCoins();
  localStorage.setItem('coins', (current + amount).toString());
  updateCoinsDisplay();
}

function getTotalQuestionsDone() {
  return parseInt(localStorage.getItem('totalQuestionsDone') || '0', 10);
}

function addQuestionsDone(count) {
  const current = getTotalQuestionsDone();
  localStorage.setItem('totalQuestionsDone', (current + count).toString());
  updateCoinsDisplay();
  updateQuestionsDisplay();
}

function updateCoinsDisplay() {
  coinsBalanceEl.textContent = `${getCoins()}🪙`;
}

function updateQuestionsDisplay() {
  questionsDoneEl.textContent = getTotalQuestionsDone();
}

function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

function showScreen(screen) {
  categoryScreen.classList.remove('active');
  quizScreen.classList.remove('active');
  resultScreen.classList.remove('active');
  leaderboardScreen.classList.remove('active');
  rulesScreen.classList.remove('active');
  screen.classList.add('active');
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Registration
setUsernameBtn.addEventListener('click', () => {
  const username = playerNameInput.value.trim();
  if (!username) {
    registerMsg.textContent = 'Please enter a username';
    registerMsg.style.display = 'block';
    registerMsg.style.color = '#ff4b4b';
    return;
  }
  setRegisteredUser(username);
  currentPlayer = username;
  registeredUserDisplay.textContent = `✓ Registered as: ${username}`;
  registeredUserDisplay.style.display = 'block';
  registerMsg.textContent = 'Username registered successfully!';
  registerMsg.style.display = 'block';
  registerMsg.style.color = '#00c8a7';
  setTimeout(() => {
    registerMsg.style.display = 'none';
  }, 3000);
});

clearUsernameBtn.addEventListener('click', () => {
  playerNameInput.value = '';
  registeredUserDisplay.style.display = 'none';
  currentPlayer = '';
  localStorage.removeItem('registeredUser');
});

// Check for existing registration
window.addEventListener('DOMContentLoaded', () => {
  const existing = getRegisteredUser();
  if (existing) {
    playerNameInput.value = existing;
    currentPlayer = existing;
    registeredUserDisplay.textContent = `✓ Registered as: ${existing}`;
    registeredUserDisplay.style.display = 'block';
  }
  updateCoinsDisplay();
  updateQuestionsDisplay();
});

// Category Selection
async function startQuiz(category) {
  if (!currentPlayer) {
    registerMsg.textContent = 'Please register a username first!';
    registerMsg.style.display = 'block';
    registerMsg.style.color = '#ff4b4b';
    return;
  }

  currentCategory = category;
  currentQuestionIndex = 0;
  score = 0;

  try {
    const categoryId = categoryMap[category];
    const url = `https://opentdb.com/api.php?amount=3&category=${categoryId}&type=multiple`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.response_code !== 0) {
      registerMsg.textContent = 'Failed to load questions. Try another category.';
      registerMsg.style.display = 'block';
      return;
    }

    selectedQuestions = data.results;
    showScreen(quizScreen);
    loadQuestion();
  } catch (error) {
    registerMsg.textContent = 'Error loading questions.';
    registerMsg.style.display = 'block';
  }
}

categoryItems.forEach(item => {
  item.addEventListener('click', () => {
    const category = item.dataset.category;
    startQuiz(category);
  });
});

// Quiz Timer
function startTimer() {
  timeLeft = 15;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    quizTimerEl.textContent = formatTime(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeUp();
    }
  }, 1000);
}

function handleTimeUp() {
  nextQuestion();
}

// Load and Display Question
function loadQuestion() {
  if (currentQuestionIndex >= selectedQuestions.length) {
    showResult();
    return;
  }

  const question = selectedQuestions[currentQuestionIndex];
  quizCategoryEl.textContent = currentCategory;
  questionNumberEl.textContent = `${currentQuestionIndex + 1}/${selectedQuestions.length}`;
  questionEl.textContent = decodeHtml(question.question);
  
  // Update progress bar
  const progress = ((currentQuestionIndex + 1) / selectedQuestions.length) * 100;
  progressFillEl.style.width = progress + '%';

  // Clear options
  optionsEl.innerHTML = '';

  // Prepare answer options
  const options = [
    ...question.incorrect_answers.map(a => decodeHtml(a)),
    decodeHtml(question.correct_answer)
  ].sort(() => Math.random() - 0.5);

  // Create option buttons
  options.forEach(option => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.addEventListener('click', () => selectAnswer(btn, option === decodeHtml(question.correct_answer)));
    li.appendChild(btn);
    optionsEl.appendChild(li);
  });

  nextBtn.disabled = true;
  startTimer();
}

// Select Answer
function selectAnswer(btn, isCorrect) {
  clearInterval(timerInterval);
  
  // Disable all buttons
  const allButtons = optionsEl.querySelectorAll('button');
  allButtons.forEach(b => b.disabled = true);

  if (isCorrect) {
    btn.classList.add('btn-success');
    score++;
  } else {
    btn.classList.add('btn-danger');
    // Show correct answer
    allButtons.forEach(b => {
      if (b.textContent === selectedQuestions[currentQuestionIndex].correct_answer || 
          decodeHtml(b.textContent) === decodeHtml(selectedQuestions[currentQuestionIndex].correct_answer)) {
        b.classList.add('btn-success');
      }
    });
  }

  nextBtn.disabled = false;
}

nextBtn.addEventListener('click', nextQuestion);

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < selectedQuestions.length) {
    loadQuestion();
  } else {
    showResult();
  }
}

// Results
function showResult() {
  clearInterval(timerInterval);
  
  const percentage = Math.round((score / selectedQuestions.length) * 100);
  scorePercentageEl.textContent = percentage + '%';
  resultDetailTextEl.textContent = `You attempted ${selectedQuestions.length} questions and got ${score} correct.`;

  // Customize result messages and icons based on score
  const resultTitleEl = document.getElementById('result-title');
  const resultMessageEl = document.getElementById('result-message');
  const resultIconEl = document.getElementById('result-icon');

  if (score === 0) {
    resultIconEl.textContent = '😢';
    resultTitleEl.textContent = 'Oh Sorry!';
    resultMessageEl.textContent = 'Try again and aim for the 1000 coins! You can do it!';
  } else if (score === 1) {
    resultIconEl.textContent = '💪';
    resultTitleEl.textContent = 'Great Start!';
    resultMessageEl.textContent = 'You are a step closer to winning 1000 coins! Keep going!';
  } else if (score === 2) {
    resultIconEl.textContent = '🎉';
    resultTitleEl.textContent = 'Nice Effort!';
    resultMessageEl.textContent = 'Almost there! One more correct answer for the grand prize!';
  } else if (score === selectedQuestions.length) {
    resultIconEl.textContent = '🏆';
    resultTitleEl.textContent = 'Perfect!';
    resultMessageEl.textContent = '🎊 You won 1000 coins! Amazing performance! 🎊';
  }

  // Award coins - perfect score 1000, partial scores 50 (2/3) or 20 (1/3)
  let coinsEarned = 0;
  if (score === selectedQuestions.length) {
    coinsEarned = 1000;
  } else if (score === 2) {
    coinsEarned = 50;
  } else if (score === 1) {
    coinsEarned = 20;
  }

  if (coinsEarned > 0) {
    addCoins(coinsEarned);
  }

  // Increment perfect scores counter only for perfect scores
  if (score === selectedQuestions.length) {
    addQuestionsDone(1);
  }
  
  showScreen(resultScreen);
}

closeQuizBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  showScreen(categoryScreen);
});

// Result Actions
shareBtn.addEventListener('click', () => {
  const text = `I scored ${score} out of ${selectedQuestions.length} on the Quiz App! 🎉`;
  if (navigator.share) {
    navigator.share({
      title: 'Quiz App',
      text: text,
    });
  } else {
    alert(text);
  }
});

retakeBtn.addEventListener('click', () => {
  startQuiz(currentCategory);
});

backHomeBtn.addEventListener('click', () => {
  showScreen(categoryScreen);
});

// Leaderboard
leaderboardBtn.addEventListener('click', () => {
  showScreen(leaderboardScreen);
});

closeLeaderboardBtn.addEventListener('click', () => {
  showScreen(categoryScreen);
});

leaderboardBackBtn.addEventListener('click', () => {
  showScreen(categoryScreen);
});

// Rules Screen
rulesBtn.addEventListener('click', () => {
  showScreen(rulesScreen);
});

closeRulesBtn.addEventListener('click', () => {
  showScreen(categoryScreen);
});

rulesBackBtn.addEventListener('click', () => {
  showScreen(categoryScreen);
});

// Initialize displays on page load
updateCoinsDisplay();
updateQuestionsDisplay();
