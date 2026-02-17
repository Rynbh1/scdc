import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function InitialLayout() {
  const { userToken, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 1. On ne fait rien tant que le token n'est pas récupéré du stockage
    if (isLoading) return;

    // 2. On détermine où on est
    // segments peut être vide au premier rendu, on gère ce cas
    const currentGroup = segments[0];
    const inAuthGroup = currentGroup === '(auth)';

    console.log(`[Nav] Token: ${!!userToken} | Group: ${currentGroup}`);

    // 3. LOGIQUE DE REDIRECTION (C'est ici qu'on casse la boucle)
    
    // Cas A : Pas de token et pas dans le groupe auth -> Login
    if (!userToken && !inAuthGroup) {
      router.replace('/(auth)/login');
    } 
    // Cas B : Token présent et on est encore dans le groupe auth (ou à la racine) -> Home
    // On vérifie explicitement 'inAuthGroup' pour ne PAS rediriger si on est déjà dans '(tabs)'
    else if (userToken && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [userToken, isLoading, segments]); // On surveille ces 3 variables

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}