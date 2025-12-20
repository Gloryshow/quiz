# Firebase Setup Instructions

## Step 1: Create Firebase Project

1. Go to [firebase.google.com](https://firebase.google.com)
2. Click "Get Started"
3. Create a new project named "QuizWave"
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Get Firebase Config

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "</>" to create a web app
4. Register app name as "QuizWave"
5. Copy the Firebase config object

## Step 3: Update Firebase Config

1. Open `index.html`
2. Find the Firebase config section (around line 10-25)
3. Replace the placeholder values with your actual config:
   - `YOUR_API_KEY`
   - `YOUR_AUTH_DOMAIN`
   - `YOUR_PROJECT_ID`
   - `YOUR_STORAGE_BUCKET`
   - `YOUR_MESSAGING_SENDER_ID`
   - `YOUR_APP_ID`

Example config (yours will be different):
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxxx...",
  authDomain: "quizwave-xxx.firebaseapp.com",
  projectId: "quizwave-xxx",
  storageBucket: "quizwave-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

## Step 4: Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Select "Email/Password" provider
4. Enable it
5. Click "Save"

## Step 5: Create Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Select "Start in production mode"
4. Choose your region (closest to your users)
5. Click "Create"

## Step 6: Set Firestore Rules

Replace Firestore rules with (Security Rules tab):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /leaderboard/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.resource.data.uid == request.auth.uid;
    }
  }
}
```

## Features Enabled

✅ Email/Password Authentication
✅ User registration and login
✅ Firestore database for user data
✅ Leaderboard with quiz scores
✅ User profile persistence

## Next Steps

After setting up Firebase:
1. Test sign up/login functionality
2. Verify leaderboard displays user scores
3. Check that scores are saved to Firestore
