'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseClient'; // Using your existing firebaseClient

interface UserData {
  fullName: string;
  bio: string;
  educationLevel: string;
  interests: string;
  email?: string;
  photoURL?: string;
  isPremium?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (userData: Partial<UserData>) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from Firestore
  const fetchUserData = async (currentUser: User) => {
    try {
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserData;
        
        // If missing name, copy from Google
        if ((!data.fullName || data.fullName.trim() === "") && currentUser.displayName) {
          const googleFullName = currentUser.displayName;
          await setDoc(docRef, { fullName: googleFullName }, { merge: true });
          data.fullName = googleFullName;
        }

        setUserData(data);
      } else {
        // New user -> create document
        const initialData: UserData = {
          fullName: currentUser.displayName || "",
          bio: "",
          educationLevel: "",
          interests: "",
          email: currentUser.email || "",
          photoURL: currentUser.photoURL || "",
          isPremium: false,
          createdAt: new Date().toISOString(),
        };
        await setDoc(docRef, initialData, { merge: true });
        setUserData(initialData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        await fetchUserData(currentUser);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (fullName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: fullName
      });
      
      // Create user document in Firestore
      const userDoc: UserData = {
        fullName: fullName,
        bio: "",
        educationLevel: "",
        interests: "",
        email: userCredential.user.email || "",
        photoURL: userCredential.user.photoURL || "",
        isPremium: false,
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, "users", userCredential.user.uid), userDoc);
      setUserData(userDoc);
    }
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (updatedData: Partial<UserData>) => {
    if (!user) throw new Error('No user logged in');

    const docRef = doc(db, "users", user.uid);
    const cleanData = {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, cleanData, { merge: true });
    
    // Update local state
    setUserData(prev => prev ? { ...prev, ...cleanData } : null);
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  const value: AuthContextType = {
    user,
    userData,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}