import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext'; 
import { AccessibilityProvider } from '../src/context/AccessibilityContext';

function InitialLayout() {
  const { userToken, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!userToken && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (userToken && inAuthGroup) {
      if (user?.role === 'manager') {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/(tabs)/home');
      }
    }
  }, [userToken, isLoading, user, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <CartProvider>
          <InitialLayout />
        </CartProvider>
      </AccessibilityProvider>
    </AuthProvider>
  );
}
