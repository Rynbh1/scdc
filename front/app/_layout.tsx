import { Slot } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      {/* Slot permet de rendre les routes enfants (tabs, auth, etc.) */}
      <Slot />
    </AuthProvider>
  );
}