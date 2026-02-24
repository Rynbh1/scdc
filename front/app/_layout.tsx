import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext'; 

function InitialLayout() {
  const { userToken, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!userToken && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (userToken && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [userToken, isLoading, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <InitialLayout />
      </CartProvider>
    </AuthProvider>
  );
}
