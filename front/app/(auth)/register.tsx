import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { registerUser } from '../../src/services/AuthService';

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // État du formulaire avec tous les champs requis par le sujet
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone_number: '',
    address: '',
    zip_code: '',
    city: '',
    country: ''
  });

  const handleRegister = async () => {
    // Validation basique
    if (!form.first_name || !form.last_name || !form.email || !form.password || !form.address) {
      Alert.alert('Erreur', 'Veuillez remplir au moins les informations obligatoires (Nom, Email, MDP, Adresse).');
      return;
    }

    setLoading(true);
    try {
      await registerUser(form);
      Alert.alert("Bienvenue !", "Compte créé avec succès. Connectez-vous maintenant.");
      router.replace('/(auth)/login');
    } catch (error) {
      console.log(error);
      Alert.alert('Erreur', "Impossible de créer le compte. Vérifiez vos données.");
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
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.logo}>Rejoindre Trinity</Text>
          <Text style={styles.subtitle}>Créez votre compte client.</Text>
        </View>

        <View style={styles.form}>
          
          {/* --- IDENTITÉ --- */}
          <Text style={styles.sectionLabel}>Identité</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, {flex: 1, marginRight: 8}]} 
              placeholder="Prénom" placeholderTextColor="#666"
              onChangeText={(t) => setForm({...form, first_name: t})}
            />
            <TextInput
              style={[styles.input, {flex: 1}]} 
              placeholder="Nom" placeholderTextColor="#666"
              onChangeText={(t) => setForm({...form, last_name: t})}
            />
          </View>

          <TextInput
            style={styles.input} placeholder="E-mail" placeholderTextColor="#666"
            autoCapitalize="none" keyboardType="email-address"
            onChangeText={(t) => setForm({...form, email: t})}
          />
          
          <TextInput
            style={styles.input} placeholder="Mot de passe" placeholderTextColor="#666"
            secureTextEntry
            onChangeText={(t) => setForm({...form, password: t})}
          />

          <TextInput
            style={styles.input} placeholder="Téléphone" placeholderTextColor="#666"
            keyboardType="phone-pad"
            onChangeText={(t) => setForm({...form, phone_number: t})}
          />

          {/* --- FACTURATION & LIVRAISON --- */}
          <Text style={styles.sectionLabel}>Facturation</Text>
          
          <TextInput
            style={styles.input} placeholder="Adresse (Rue, Numéro...)" placeholderTextColor="#666"
            onChangeText={(t) => setForm({...form, address: t})}
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.input, {flex: 1, marginRight: 8}]} 
              placeholder="Code Postal" placeholderTextColor="#666"
              keyboardType="number-pad"
              onChangeText={(t) => setForm({...form, zip_code: t})}
            />
            <TextInput
              style={[styles.input, {flex: 2}]} 
              placeholder="Ville" placeholderTextColor="#666"
              onChangeText={(t) => setForm({...form, city: t})}
            />
          </View>

          <TextInput
            style={styles.input} placeholder="Pays" placeholderTextColor="#666"
            onChangeText={(t) => setForm({...form, country: t})}
          />

          {/* --- BOUTONS --- */}
          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>S'inscrire</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Retour à la connexion</Text>
          </TouchableOpacity>
          
          {/* Espace vide pour le scroll */}
          <View style={{height: 50}} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { padding: 24, paddingTop: 60 },
  
  header: { marginBottom: 30 },
  logo: { fontSize: 32, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 16, color: '#888', marginTop: 8 },
  
  form: { gap: 12 },
  sectionLabel: { color: '#888', textTransform: 'uppercase', fontSize: 12, marginTop: 10, marginBottom: 5, fontWeight: 'bold' },
  
  row: { flexDirection: 'row' },
  
  input: { 
    backgroundColor: '#111', borderRadius: 12, padding: 16, 
    color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#222' 
  },
  
  button: { backgroundColor: '#fff', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '600' },
  
  secondaryButton: { marginTop: 15, alignItems: 'center', padding: 10 },
  secondaryButtonText: { color: '#666', fontSize: 14 },
});