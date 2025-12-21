// Import Firebase utilities
import { 
  signUp, 
  signIn, 
  logOut, 
  getUserData, 
  updateUserCoins, 
  updatePerfectScores, 
  updateUserDisplayName,
  updateUserProfilePicture,
  saveQuizResult, 
  getLeaderboard, 
  onAuthChange 
} from './firebase-utils.js';

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const categoryScreen = document.getElementById('category-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const leaderboardScreen = document.getElementById('leaderboard-screen');
const rulesScreen = document.getElementById('rules-screen');

const scorePercentageEl = document.getElementById('score-percentage');
const resultDetailTextEl = document.getElementById('result-detail-text');
const shareBtn = document.getElementById('share-btn');
const retakeBtn = document.getElementById('retake-btn');
const backHomeBtn = document.getElementById('back-home-btn');

const questionEl = document.getElementById('question');
const questionNumberEl = document.getElementById('question-number');
const optionsEl = document.getElementById('options');
const quizCategoryEl = document.getElementById('quiz-category');
const quizTimerEl = document.getElementById('quiz-timer');
const progressFillEl = document.getElementById('progress-fill');
const nextBtn = document.getElementById('next');
const closeQuizBtn = document.getElementById('close-quiz');

const menuBtn = document.getElementById('menu-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const changeUsernameItem = document.getElementById('change-username-item');
const leaderboardItemDropdown = document.getElementById('leaderboard-item');
const rulesItemDropdown = document.getElementById('rules-item');
const signOutItem = document.getElementById('sign-out-item');

const leaderboardBtn = document.getElementById('leaderboard-btn');
console.log('leaderboardBtn:', leaderboardBtn);
const closeLeaderboardBtn = document.getElementById('close-leaderboard');
const leaderboardBackBtn = document.getElementById('leaderboard-back-btn');
const rulesBtn = document.getElementById('rules-btn');
const closeRulesBtn = document.getElementById('close-rules');
const rulesBackBtn = document.getElementById('rules-back-btn');

const questionsDoneEl = document.getElementById('questions-done');
const coinsBalanceEl = document.getElementById('coins-balance');
const userDisplayEl = document.getElementById('user-display');

const profileBtn = document.getElementById('profile-btn');
const profileModal = document.getElementById('profile-modal');
const modalClose = document.getElementById('modal-close');
const uploadBtn = document.getElementById('upload-btn');
const profileFileInput = document.getElementById('profile-file-input');
const profilePreviewImg = document.getElementById('profile-preview-img');
const profilePreviewEmoji = document.getElementById('profile-preview-emoji');
const saveProfileBtn = document.getElementById('save-profile-btn');
const removeProfileBtn = document.getElementById('remove-profile-btn');

// State
let currentQuestionIndex = 0;
let score = 0;
let selectedQuestions = [];
let currentPlayer = '';
let currentCategory = '';
let timerInterval = null;
let timeLeft = 15; // 15 seconds per question
let currentUser = null; // Firebase user
let selectedProfilePictureBase64 = null; // Profile picture state

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
function getUserId() {
  return currentUser ? currentUser.uid : null;
}

function getCoins() {
  const userId = getUserId();
  if (!userId) return 0;
  return parseInt(localStorage.getItem(`coins_${userId}`) || '0', 10);
}

function addCoins(amount) {
  const userId = getUserId();
  if (!userId) return;
  const current = getCoins();
  localStorage.setItem(`coins_${userId}`, (current + amount).toString());
  updateCoinsDisplay();
}

function getTotalQuestionsDone() {
  const userId = getUserId();
  if (!userId) return 0;
  return parseInt(localStorage.getItem(`totalQuestionsDone_${userId}`) || '0', 10);
}

function addQuestionsDone(count) {
  const userId = getUserId();
  if (!userId) return;
  const current = getTotalQuestionsDone();
  localStorage.setItem(`totalQuestionsDone_${userId}`, (current + count).toString());
  updateCoinsDisplay();
  updateQuestionsDisplay();
}

function getSavedUsername() {
  const userId = getUserId();
  if (!userId) return null;
  return localStorage.getItem(`savedUsername_${userId}`);
}

function saveUsername(username) {
  const userId = getUserId();
  if (!userId) return;
  localStorage.setItem(`savedUsername_${userId}`, username);
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
  authScreen.classList.remove('active');
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

// Auth Tab Switching
const authTabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const loginMsg = document.getElementById('login-msg');
const signupMsg = document.getElementById('signup-msg');

authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    authTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    if (tab.dataset.tab === 'login') {
      loginForm.classList.add('active');
      signupForm.classList.remove('active');
    } else {
      signupForm.classList.add('active');
      loginForm.classList.remove('active');
    }
  });
});

// Login
loginBtn.addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  
  if (!email || !password) {
    loginMsg.textContent = '❌ Please enter email and password';
    loginMsg.style.color = '#ff4b4b';
    return;
  }
  
  try {
    loginMsg.textContent = '⏳ Logging in...';
    loginMsg.style.color = '#ffa500';
    
    const user = await signIn(email, password);
    loginMsg.textContent = '✅ Login successful!';
    loginMsg.style.color = '#00c8a7';
    
    setTimeout(() => {
      showScreen(categoryScreen);
    }, 1000);
  } catch (error) {
    loginMsg.textContent = `❌ ${error.message}`;
    loginMsg.style.color = '#ff4b4b';
  }
});

// Sign Up
signupBtn.addEventListener('click', async () => {
  const username = document.getElementById('signup-username').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();
  
  if (!username || !email || !password) {
    signupMsg.textContent = '❌ Please fill all fields';
    signupMsg.style.color = '#ff4b4b';
    return;
  }
  
  if (password.length < 6) {
    signupMsg.textContent = '❌ Password must be at least 6 characters';
    signupMsg.style.color = '#ff4b4b';
    return;
  }
  
  try {
    signupMsg.textContent = '⏳ Creating account...';
    signupMsg.style.color = '#ffa500';
    
    const user = await signUp(email, password, username);
    signupMsg.textContent = '✅ Account created! Logging in...';
    signupMsg.style.color = '#00c8a7';
    
    currentPlayer = username;
    currentUser = user;
    saveUsername(username);
    
    setTimeout(() => {
      showScreen(categoryScreen);
    }, 1000);
  } catch (error) {
    signupMsg.textContent = `❌ ${error.message}`;
    signupMsg.style.color = '#ff4b4b';
  }
});

// Monitor Auth State
onAuthChange((user) => {
  if (user) {
    currentUser = user;
    // Try to load saved username from localStorage, fallback to Firebase displayName
    const savedUsername = getSavedUsername();
    if (savedUsername) {
      currentPlayer = savedUsername;
    } else {
      currentPlayer = user.displayName || user.email.split('@')[0];
    }
    userDisplayEl.textContent = `👤 ${currentPlayer}`;
    
    // Load profile picture from Firebase
    getUserData(user.uid).then((userData) => {
      if (userData && userData.profilePicture) {
        profileBtn.innerHTML = `<img src="${userData.profilePicture}" alt="Profile">`;
        profileBtn.style.overflow = 'hidden';
        profileBtn.style.padding = '0';
      } else {
        profileBtn.innerHTML = '👤';
        profileBtn.style.overflow = 'visible';
        profileBtn.style.padding = '';
      }
    }).catch((error) => {
      console.error('Error loading user profile:', error);
    });
    
    showScreen(categoryScreen);
  } else {
    showScreen(authScreen);
  }
});

// Quiz Logic
updateCoinsDisplay();
updateQuestionsDisplay();

// Category Selection
const categoryItems = document.querySelectorAll('.category-item');
async function startQuiz(category) {
  if (!currentPlayer) {
    console.error('Please login first!');
    return;
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
      console.error('Failed to load questions');
      return;
    }

    selectedQuestions = data.results;
    showScreen(quizScreen);
    loadQuestion();
  } catch (error) {
    console.error('Error loading questions:', error);
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

  // Save quiz result to Firestore
  if (currentUser) {
    saveQuizResult(currentUser.uid, {
      category: currentCategory,
      score: score,
      totalQuestions: selectedQuestions.length,
      coinsEarned: coinsEarned,
      percentage: percentage
    });
    
    // Update user coins and perfect scores in Firestore
    updateUserCoins(currentUser.uid, getCoins());
    // Always update perfectScores (when score is perfect)
    if (score === selectedQuestions.length) {
      updatePerfectScores(currentUser.uid, getTotalQuestionsDone());
    }
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
if (leaderboardBtn) {
  console.log('Leaderboard button found and listener attached');
  leaderboardBtn.addEventListener('click', async () => {
    console.log('Leaderboard button clicked!');
    try {
      const leaderboard = await getLeaderboard(100);
      const leaderboardList = document.getElementById('leaderboard-list');
      
      if (leaderboardList) {
        leaderboardList.innerHTML = '';
        
        if (leaderboard.length === 0) {
          leaderboardList.innerHTML = '<p style="text-align: center; color: #888;">No users yet. Be the first!</p>';
        } else {
          leaderboard.forEach((user, index) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            row.innerHTML = `
              <span class="rank">#${index + 1}</span>
              <span class="name">${user.displayName || user.email}</span>
              <span class="score">${user.perfectScores} ⭐</span>
              <span class="coins">${user.coins} 🪙</span>
            `;
            leaderboardList.appendChild(row);
          });
        }
      }
      showScreen(leaderboardScreen);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  });
}

if (closeLeaderboardBtn) {
  closeLeaderboardBtn.addEventListener('click', () => {
    showScreen(categoryScreen);
  });
}

if (leaderboardBackBtn) {
  leaderboardBackBtn.addEventListener('click', () => {
    showScreen(categoryScreen);
  });
}

// Rules Screen
if (rulesBtn) {
  rulesBtn.addEventListener('click', () => {
    showScreen(rulesScreen);
  });
}

if (closeRulesBtn) {
  closeRulesBtn.addEventListener('click', () => {
    showScreen(categoryScreen);
  });
}

if (rulesBackBtn) {
  rulesBackBtn.addEventListener('click', () => {
    showScreen(categoryScreen);
  });
}

// Dropdown Menu Handler
menuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  dropdownMenu.classList.toggle('active');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-container')) {
    dropdownMenu.classList.remove('active');
  }
});

// Dropdown menu items
changeUsernameItem.addEventListener('click', (e) => {
  e.preventDefault();
  dropdownMenu.classList.remove('active');
  const newUsername = prompt('Enter your new username:');
  if (newUsername && newUsername.trim()) {
    currentPlayer = newUsername.trim();
    saveUsername(currentPlayer);
    userDisplayEl.textContent = `👤 ${currentPlayer}`;
    
    // Update in Firebase
    if (currentUser) {
      updateUserDisplayName(currentUser.uid, currentPlayer);
    }
    
    alert(`Username changed to: ${currentPlayer}`);
  }
});

leaderboardItemDropdown.addEventListener('click', async (e) => {
  e.preventDefault();
  dropdownMenu.classList.remove('active');
  try {
    const leaderboard = await getLeaderboard(100);
    const leaderboardList = document.getElementById('leaderboard-list');
    
    if (leaderboardList) {
      leaderboardList.innerHTML = '';
      
      if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<p style="text-align: center; color: #888;">No users yet. Be the first!</p>';
      } else {
        leaderboard.forEach((user, index) => {
          const row = document.createElement('div');
          row.className = 'leaderboard-row';
          row.innerHTML = `
            <span class="rank">#${index + 1}</span>
            <span class="name">${user.displayName || user.email}</span>
            <span class="score">${user.perfectScores} ⭐</span>
            <span class="coins">${user.coins} 🪙</span>
          `;
          leaderboardList.appendChild(row);
        });
      }
    }
    showScreen(leaderboardScreen);
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }
});

rulesItemDropdown.addEventListener('click', (e) => {
  e.preventDefault();
  dropdownMenu.classList.remove('active');
  showScreen(rulesScreen);
});

signOutItem.addEventListener('click', async (e) => {
  e.preventDefault();
  dropdownMenu.classList.remove('active');
  try {
    await logOut();
    currentPlayer = '';
    showScreen(authScreen);
  } catch (error) {
    console.error('Error signing out:', error);
    alert('Error signing out');
  }
});

// Profile Picture Management
profileBtn.addEventListener('click', () => {
  profileModal.classList.add('active');
});

modalClose.addEventListener('click', () => {
  profileModal.classList.remove('active');
  selectedProfilePictureBase64 = null;
  profilePreviewImg.style.display = 'none';
  profilePreviewEmoji.style.display = 'block';
  saveProfileBtn.style.display = 'none';
  removeProfileBtn.style.display = 'none';
  uploadBtn.style.display = 'block';
});

uploadBtn.addEventListener('click', () => {
  profileFileInput.click();
});

profileFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      selectedProfilePictureBase64 = event.target.result;
      profilePreviewImg.src = selectedProfilePictureBase64;
      profilePreviewImg.style.display = 'block';
      profilePreviewEmoji.style.display = 'none';
      saveProfileBtn.style.display = 'block';
      removeProfileBtn.style.display = 'block';
      uploadBtn.textContent = 'Choose Another Image';
    };
    reader.readAsDataURL(file);
  }
});

saveProfileBtn.addEventListener('click', async () => {
  if (currentUser && selectedProfilePictureBase64) {
    try {
      await updateUserProfilePicture(currentUser.uid, selectedProfilePictureBase64);
      // Update profile button with image
      profileBtn.innerHTML = `<img src="${selectedProfilePictureBase64}" alt="Profile">`;
      profileBtn.style.overflow = 'hidden';
      profileBtn.style.padding = '0';
      profileModal.classList.remove('active');
      selectedProfilePictureBase64 = null;
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error saving profile picture:', error);
      alert('Error saving profile picture');
    }
  }
});

removeProfileBtn.addEventListener('click', async () => {
  if (currentUser) {
    try {
      await updateUserProfilePicture(currentUser.uid, null);
      // Reset profile button to emoji
      profileBtn.innerHTML = '👤';
      profileBtn.style.overflow = 'visible';
      profileBtn.style.padding = '';
      profileModal.classList.remove('active');
      selectedProfilePictureBase64 = null;
      alert('Profile picture removed!');
    } catch (error) {
      console.error('Error removing profile picture:', error);
      alert('Error removing profile picture');
    }
  }
});

// Close modal when clicking outside
profileModal.addEventListener('click', (e) => {
  if (e.target === profileModal) {
    profileModal.classList.remove('active');
    selectedProfilePictureBase64 = null;
    profilePreviewImg.style.display = 'none';
    profilePreviewEmoji.style.display = 'block';
    saveProfileBtn.style.display = 'none';
    removeProfileBtn.style.display = 'none';
    uploadBtn.style.display = 'block';
  }
});

// Initialize displays on page load
updateCoinsDisplay();
updateQuestionsDisplay();
