import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA9nV0BgswCwwrezu3zBMNuyQ3QKkLzjAU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "controll-v.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "controll-v",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "controll-v.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "984470653646",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:984470653646:web:e77768ff619b66a65ade9f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ZPWXX02X6C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;

