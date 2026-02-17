import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import apiClient from '../../src/api/client';
import { StatusBar } from 'expo-status-bar';

export default function ProfileScreen() {
  const { signOut, userToken } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/auth/me');
        setProfile(response.data);
      } catch (error) {
        console.error(error);
        Alert.alert("Erreur", "Impossible de récupérer vos informations.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vraiment vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Déconnexion", 
          style: "destructive", 
          onPress: async () => {
            await signOut();
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={40} color="#fff" />
        </View>
        <Text style={styles.name}>
          {profile?.first_name || 'Client'} {profile?.last_name || 'Trinity'}
        </Text>
        <Text style={styles.role}>{profile?.role || 'Utilisateur'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes Informations</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color="#888" />
          <View style={styles.infoContent}>
            <Text style={styles.label}>E-mail</Text>
            <Text style={styles.value}>{profile?.email}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={20} color="#888" />
          <View style={styles.infoContent}>
            <Text style={styles.label}>Téléphone</Text>
            <Text style={styles.value}>{profile?.phone_number || 'Non renseigné'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Facturation & Livraison</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#888" />
          <View style={styles.infoContent}>
            <Text style={styles.label}>Adresse</Text>
            <Text style={styles.value}>{profile?.address || 'Non renseignée'}</Text>
            <Text style={styles.value}>
              {profile?.zip_code} {profile?.city}
            </Text>
            <Text style={styles.value}>{profile?.country}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={24} color="#fff" style={{marginRight: 10}} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
      
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  
  header: { alignItems: 'center', marginVertical: 30 },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 2, borderColor: '#555' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  role: { fontSize: 14, color: '#888', textTransform: 'uppercase', marginTop: 5 },

  section: { backgroundColor: '#111', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#222' },
  sectionTitle: { color: '#666', fontSize: 14, textTransform: 'uppercase', marginBottom: 15, fontWeight: '700' },
  
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoContent: { marginLeft: 15, flex: 1 },
  label: { color: '#666', fontSize: 12 },
  value: { color: '#fff', fontSize: 16, marginTop: 2 },
  
  divider: { height: 1, backgroundColor: '#222', marginVertical: 15, marginLeft: 35 },

  logoutButton: { flexDirection: 'row', backgroundColor: '#d32f2f', padding: 18, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});