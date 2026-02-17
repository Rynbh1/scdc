import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function InitialLayout() {
  const { userToken, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const currentGroup = segments[0];
    const inAuthGroup = currentGroup === '(auth)';

    console.log(`[Nav] Token: ${!!userToken} | Group: ${currentGroup}`);
    if (!userToken && !inAuthGroup) {
      router.replace('/(auth)/login');
    } 
    else if (userToken && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [userToken, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}