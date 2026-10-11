// Firebase configuration
// These environment variables must be set in .env.local
// See .env.example for the required variables.
//
// This module is only imported by client components ('use client').
// It should never run during static prerendering.

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'placeholder',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Validate required config in browser only
if (typeof window !== 'undefined') {
  const requiredKeys: (keyof typeof firebaseConfig)[] = ['apiKey', 'authDomain', 'projectId'];
  const missingKeys = requiredKeys.filter(
    (key) => !firebaseConfig[key] || firebaseConfig[key] === 'placeholder'
  );
  if (missingKeys.length > 0) {
    console.error(
      `[Remnexa] Missing Firebase configuration: ${missingKeys.join(', ')}. ` +
        'Set the corresponding NEXT_PUBLIC_FIREBASE_* environment variables in .env.local.'
    );
  }
}

// Initialize Firebase (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, storage, googleProvider };
