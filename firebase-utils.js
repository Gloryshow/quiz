// Firebase Auth & Firestore Utilities
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  setDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Sign Up
export async function signUp(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(window.auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore with all fields initialized
    await setDoc(doc(window.db, "users", user.uid), {
      uid: user.uid,
      email: email,
      displayName: displayName,
      coins: 0,
      perfectScores: 0,
      profilePicture: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return user;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Sign In
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(window.auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Sign Out
export async function logOut() {
  try {
    await signOut(window.auth);
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get Current User Data
export async function getUserData(uid) {
  try {
    const userDoc = await getDoc(doc(window.db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Update User Coins
export async function updateUserCoins(uid, coins) {
  try {
    await setDoc(doc(window.db, "users", uid), {
      coins: coins,
      updatedAt: new Date()
    }, { merge: true });
  } catch (error) {
    throw new Error(error.message);
  }
}

// Update Perfect Scores
export async function updatePerfectScores(uid, count) {
  try {
    await setDoc(doc(window.db, "users", uid), {
      perfectScores: count,
      updatedAt: new Date()
    }, { merge: true });
  } catch (error) {
    throw new Error(error.message);
  }
}

// Update User Display Name
export async function updateUserDisplayName(uid, displayName) {
  try {
    await setDoc(doc(window.db, "users", uid), {
      displayName: displayName,
      updatedAt: new Date()
    }, { merge: true });
  } catch (error) {
    throw new Error(error.message);
  }
}

// Update User Profile Picture
export async function updateUserProfilePicture(uid, profilePictureBase64) {
  try {
    await setDoc(doc(window.db, "users", uid), {
      profilePicture: profilePictureBase64,
      updatedAt: new Date()
    }, { merge: true });
  } catch (error) {
    throw new Error(error.message);
  }
}

// Save Quiz Result
export async function saveQuizResult(uid, result) {
  try {
    await addDoc(collection(window.db, "quizResults"), {
      uid: uid,
      category: result.category,
      score: result.score,
      totalQuestions: result.totalQuestions,
      coinsEarned: result.coinsEarned,
      percentage: result.percentage,
      timestamp: new Date()
    });
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get Leaderboard (Top 100 users by perfect scores)
export async function getLeaderboard(limit_count = 100) {
  try {
    const q = query(
      collection(window.db, "users"),
      orderBy("perfectScores", "desc"),
      orderBy("coins", "desc"),
      limit(limit_count)
    );
    
    const snapshot = await getDocs(q);
    const leaderboard = [];
    
    snapshot.forEach((doc, index) => {
      leaderboard.push({
        rank: index + 1,
        ...doc.data()
      });
    });
    
    return leaderboard;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get Daily Leaderboard (individual games from today only, ranked by score)
export async function getDailyLeaderboard(limit_count = 100) {
  try {
    // Get all quiz results
    const resultsQuery = query(
      collection(window.db, "quizResults"),
      orderBy("timestamp", "desc")
    );
    
    const snapshot = await getDocs(resultsQuery);
    
    // Get today's date range in UTC
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    
    console.log('Daily leaderboard filter - Today start:', todayStart, 'Today end:', todayEnd);
    
    // Get individual game results from today
    const todayGames = [];
    snapshot.forEach((doc) => {
      const result = doc.data();
      const resultDate = result.timestamp?.toDate?.() || new Date(result.timestamp);
      
      console.log('Checking result from', resultDate, 'is between', todayStart, 'and', todayEnd);
      
      // Only include results from today
      if (resultDate >= todayStart && resultDate <= todayEnd) {
        todayGames.push({
          uid: result.uid,
          displayName: result.displayName || 'Unknown',
          email: result.email || '',
          score: result.score,
          totalQuestions: result.totalQuestions,
          coinsEarned: result.coinsEarned || 0,
          percentage: result.percentage || 0,
          timestamp: resultDate
        });
      }
    });
    
    console.log('Daily leaderboard games:', todayGames.length);
    
    // Sort by score (descending), then by coins, then by timestamp (newest first)
    const leaderboard = todayGames
      .sort((a, b) => {
        // Primary sort: by score (higher is better)
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Secondary sort: by coins earned
        if (b.coinsEarned !== a.coinsEarned) {
          return b.coinsEarned - a.coinsEarned;
        }
        // Tertiary sort: by timestamp (newer first)
        return b.timestamp - a.timestamp;
      })
      .slice(0, limit_count)
      .map((game, index) => ({
        rank: index + 1,
        ...game,
        perfectScores: game.score === game.totalQuestions ? 1 : 0,
        coins: game.coinsEarned
      }));
    
    return leaderboard;
  } catch (error) {
    console.error('Error getting daily leaderboard:', error);
    throw new Error(error.message);
  }
}

// Monitor Auth State
export function onAuthChange(callback) {
  return onAuthStateChanged(window.auth, callback);
}
