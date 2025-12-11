import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authService } from '@/lib/firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    return await authService.loginWithEmail(email, password);
  };

  const registerWithEmail = async (email: string, password: string, displayName?: string) => {
    return await authService.registerWithEmail(email, password, displayName);
  };

  const loginWithGoogle = async () => {
    return await authService.loginWithGoogle();
  };

  const logout = async () => {
    return await authService.logout();
  };

  const resetPassword = async (email: string) => {
    return await authService.resetPassword(email);
  };

  return { 
    user, 
    loading, 
    userId: user?.uid || 'demo-user',
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    resetPassword,
  };
}


