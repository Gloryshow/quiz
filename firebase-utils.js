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
    
    // Create user document in Firestore
    await setDoc(doc(window.db, "users", user.uid), {
      uid: user.uid,
      email: email,
      displayName: displayName,
      coins: 0,
      perfectScores: 0,
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

// Monitor Auth State
export function onAuthChange(callback) {
  return onAuthStateChanged(window.auth, callback);
}
