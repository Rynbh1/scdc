import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { loginUser } from '../../src/services/AuthService';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleRegister = async () => {
    router.replace('/(auth)/register');
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Champs requis', 'Veuillez remplir votre e-mail et votre mot de passe.');
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(email, password);
      
      console.log("CONTENU DE DATA:", JSON.stringify(data));

      if (data && data.access_token) {
        const token = String(data.access_token);
        console.log("Token valide extrait, stockage...");
        
        await signIn(token); 
        
        setTimeout(() => {
          router.replace('/(tabs)/home'); 
        }, 100);
        
      } else {
        console.error("Réponse reçue mais pas de access_token:", data);
        Alert.alert('Erreur', 'Réponse du serveur incorrecte.');
      }
    } catch (error: any) {
      console.error("Erreur dans handleLogin:", error.response?.data || error.message);
      Alert.alert('Erreur', 'Identifiants invalides.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={styles.container}
    >
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.logo}>Trinity</Text> 
        <Text style={styles.subtitle}>Connectez-vous pour gérer votre magasin.</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleRegister}>
          <Text style={styles.secondaryButtonText}>Créer un compte</Text> 
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', padding: 24 },
  header: { marginBottom: 48 },
  logo: { fontSize: 42, fontWeight: '700', color: '#fff', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#888', marginTop: 8 },
  form: { gap: 16 },
  input: { backgroundColor: '#111', borderRadius: 12, padding: 18, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#222' },
  button: { backgroundColor: '#fff', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '600' },
  secondaryButton: { marginTop: 8, alignItems: 'center' },
  secondaryButtonText: { color: '#666', fontSize: 14 },
}); 