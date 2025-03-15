"use client";

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Log the config for debugging (without sensitive values)
console.log('Firebase config loaded:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'API key exists' : 'API key missing',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId
});

// Initialize Firebase
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

// Only initialize Firebase on the client side
if (typeof window !== 'undefined') {
  try {
    if (!firebaseConfig.apiKey) {
      throw new Error('Firebase API key is missing. Check your environment variables.');
    }
    
    // Initialize or get existing Firebase app
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    
    // Initialize Auth
    auth = getAuth(app);
    
    // Initialize Firestore with settings to improve reliability
    db = getFirestore(app);
    
    // Initialize Google Auth Provider
    googleProvider = new GoogleAuthProvider();
    
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    // Provide fallback values to prevent app from crashing
    app = null;
    auth = null;
    db = null;
    googleProvider = null;
  }
} else {
  console.log('Firebase not initialized on server side');
}

/*
 * IMPORTANT: Firestore Indexes
 * 
 * This application requires the following Firestore indexes:
 * 
 * 1. Collection: transactions
 *    Fields indexed:
 *    - userId (Ascending)
 *    - date (Descending)
 * 
 * 2. Collection: transactions
 *    Fields indexed:
 *    - userId (Ascending)
 *    - date (Ascending)
 * 
 * 3. Collection: transactions
 *    Fields indexed:
 *    - userId (Ascending)
 *    - date (Ascending) - Range
 * 
 * To create these indexes:
 * 1. Go to Firebase Console: https://console.firebase.google.com
 * 2. Select your project
 * 3. Go to Firestore Database > Indexes tab
 * 4. Click "Add Index"
 * 5. Create each of the indexes listed above
 * 
 * Alternatively, when you run a query that requires an index,
 * Firebase will log an error with a direct link to create the index.
 * Click that link to automatically create the required index.
 */

export { app, auth, db, googleProvider }; 