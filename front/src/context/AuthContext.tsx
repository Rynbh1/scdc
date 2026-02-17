import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { tokenStorage } from '../utils/storage';

interface AuthContextType {
  userToken: string | null;
  user: any | null;
  isLoading: boolean;
  signIn: (data: any) => Promise<void>;
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
      if (token) setUserToken(token);
      if (userData) setUser(JSON.parse(userData));
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
      const target =
        user?.role === 'manager'
          ? '/dashboard'
          : '/(tabs)/home';

      router.replace(target);
    }

  }, [userToken, isLoading]);


  const signIn = async (data: any) => {
    await tokenStorage.setItem('userToken', data.access_token);
    await tokenStorage.setItem('userData', JSON.stringify({ role: data.role }));
    setUserToken(data.access_token);
    setUser({ role: data.role });
  };

  const signOut = async () => {
    await tokenStorage.deleteItem('userToken');
    await tokenStorage.deleteItem('userData');
    setUserToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ userToken, user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return context;
};