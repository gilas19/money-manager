"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  Auth,
  GoogleAuthProvider as FirebaseGoogleProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { User } from '@/types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  error: Error | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserData: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if Firebase auth is initialized
    if (!auth) {
      console.error('Firebase auth is not initialized');
      setError(new Error('Firebase authentication is not available'));
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = auth.onAuthStateChanged(async (user: FirebaseUser | null) => {
        setCurrentUser(user);
        
        if (user && db) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              setUserData(userDoc.data() as User);
            } else {
              // Create new user document if it doesn't exist
              const newUser: User = {
                id: user.uid,
                email: user.email || '',
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                currency: 'USD',
                households: [],
              };
              
              await setDoc(userDocRef, newUser);
              setUserData(newUser);
            }
          } catch (err) {
            console.error('Error fetching user data:', err);
            setError(err instanceof Error ? err : new Error('Unknown error fetching user data'));
          }
        } else {
          setUserData(null);
        }
        
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up auth state listener:', err);
      setError(err instanceof Error ? err : new Error('Unknown error setting up authentication'));
      setLoading(false);
      return () => {};
    }
  }, []);

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) {
      setError(new Error('Firebase authentication is not available'));
      return;
    }

    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Error signing in with Google:', err);
      setError(err instanceof Error ? err : new Error('Failed to sign in with Google'));
    }
  };

  const signOut = async () => {
    if (!auth) {
      setError(new Error('Firebase authentication is not available'));
      return;
    }

    try {
      setError(null);
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err instanceof Error ? err : new Error('Failed to sign out'));
    }
  };

  const updateUserData = async (data: Partial<User>) => {
    if (!currentUser || !db) {
      setError(new Error('User not authenticated or database not available'));
      return;
    }
    
    try {
      setError(null);
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, { ...userData, ...data }, { merge: true });
      setUserData(prev => prev ? { ...prev, ...data } : null);
    } catch (err) {
      console.error('Error updating user data:', err);
      setError(err instanceof Error ? err : new Error('Failed to update user data'));
    }
  };

  const value = {
    currentUser,
    userData,
    loading,
    error,
    signInWithGoogle,
    signOut,
    updateUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 