import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
// 1. Importe ton CartProvider ici
import { CartProvider } from '../src/context/CartContext'; 

function InitialLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/home');
    }
  }, [user, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    // 2. Enveloppe toute l'application avec les Providers
    <AuthProvider>
      <CartProvider>
        <InitialLayout />
      </CartProvider>
    </AuthProvider>
  );
}