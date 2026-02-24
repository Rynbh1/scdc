import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { tokenStorage } from '../utils/storage';
import apiClient from '../api/client';

interface AuthContextType {
  userToken: string | null;
  user: any | null;
  isLoading: boolean;
  signIn: (token: string, userData?: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const token = await tokenStorage.getItem('userToken');
      const userData = await tokenStorage.getItem('userData');

      if (token) {
        setUserToken(token);
      }

      if (userData) {
        setUser(JSON.parse(userData));
      } else if (token) {
        try {
          const profileRes = await apiClient.get('/auth/me');
          setUser(profileRes.data);
          await tokenStorage.setItem('userData', JSON.stringify(profileRes.data));
        } catch {
          await tokenStorage.deleteItem('userToken');
        }
      }

      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!userToken && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (userToken && inAuthGroup) {
      const target = user?.role === 'manager' ? '/(tabs)/dashboard' : '/(tabs)/home';
      router.replace(target);
    }
  }, [userToken, user, isLoading, segments, router]);

  const signIn = async (token: string, userData?: any) => {
    await tokenStorage.setItem('userToken', token);
    setUserToken(token);

    let resolvedUser = userData;
    if (!resolvedUser) {
      const profileRes = await apiClient.get('/auth/me');
      resolvedUser = profileRes.data;
    }

    if (resolvedUser) {
      await tokenStorage.setItem('userData', JSON.stringify(resolvedUser));
      setUser(resolvedUser);
    }
  };

  const signOut = async () => {
    await tokenStorage.deleteItem('userToken');
    await tokenStorage.deleteItem('userData');
    setUserToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ userToken, user, isLoading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return context;
};
