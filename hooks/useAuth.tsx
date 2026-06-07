// hooks/useAuth.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/constants/firebase';

export type UserRole = 'student' | 'instructor';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  studentId?: string;
  department?: string;
  enrolledCourses?: string[];
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    studentId?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          const docRef = doc(db, 'users', firebaseUser.uid);
          try {
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              setProfile(snap.data() as UserProfile);
            } else {
              console.warn('No profile document found for user:', firebaseUser.uid);
            }
          } catch (docError: any) {
            if (docError.code === 'unavailable' || docError.message.includes('offline')) {
              console.log('Firestore is offline, skipping profile fetch for now.');
            } else {
              throw docError;
            }
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    studentId?: string
  ) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const newProfile: UserProfile = {
      uid: credential.user.uid,
      email,
      name,
      role,
      studentId: studentId || '',
      department: 'Computer Science',
      enrolledCourses: [],
    };
    await setDoc(doc(db, 'users', credential.user.uid), newProfile);
    setProfile(newProfile);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
