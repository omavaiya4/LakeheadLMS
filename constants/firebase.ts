// constants/firebase.ts
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyA92XelM3w0JwqOUJrxiJPwFeAq204NZto",
  authDomain: "lakehead-lms.firebaseapp.com",
  projectId: "lakehead-lms",
  storageBucket: "lakehead-lms.firebasestorage.app",
  messagingSenderId: "1056203909337",
  appId: "1:1056203909337:web:16f7cfd66041b5b90eb6c8",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export default app;