import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import apiClient from '../../src/api/client';
import { updateProfile } from '../../src/services/AuthService';
import { useAuth } from '../../src/context/AuthContext';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<any>(null);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      setUser(response.data);
      setEditedUser(response.data);
    } catch (error) {
      console.error("Fetch profile error:", error);
      Alert.alert("Erreur", "Impossible de charger le profil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await updateProfile(editedUser);
      setUser(updated);
      setIsEditing(false);
      Alert.alert("Succès", "Profil mis à jour !");
    } catch (error) {
      Alert.alert("Erreur", "La mise à jour a échoué");
    } finally {
      setLoading(false);
    }
  };

  // 1. Affiche un loader tant que les données ne sont pas là
  if (loading || !user || !editedUser) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const fields = [
    { label: 'Prénom', key: 'first_name' },
    { label: 'Nom', key: 'last_name' },
    { label: 'Téléphone', key: 'phone_number' },
    { label: 'Adresse', key: 'address' },
    { label: 'Ville', key: 'city' },
    { label: 'Code Postal', key: 'zip_code' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Mon Profil</Text>

      <View style={styles.card}>
        {fields.map((field) => (
          <View key={field.key} style={styles.inputGroup}>
            <Text style={styles.label}>{field.label}</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedUser[field.key] || ''}
                onChangeText={(val) => setEditedUser({ ...editedUser, [field.key]: val })}
                placeholderTextColor="#666"
                placeholder={`Entrez votre ${field.label.toLowerCase()}`}
              />
            ) : (
              <Text style={styles.value}>{user[field.key] || 'Non renseigné'}</Text>
            )}
          </View>
        ))}

        <TouchableOpacity 
          style={[styles.button, isEditing ? styles.saveButton : styles.editButton]} 
          onPress={isEditing ? handleSave : () => setIsEditing(true)}
        >
          <Text style={styles.buttonText}>{isEditing ? 'Enregistrer' : 'Modifier les infos'}</Text>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity style={styles.cancelButton} onPress={() => {
            setEditedUser(user); // Reset les modifs
            setIsEditing(false);
          }}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  card: { backgroundColor: '#111', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#222' },
  inputGroup: { marginBottom: 15 },
  label: { color: '#666', fontSize: 12, marginBottom: 5, textTransform: 'uppercase' },
  value: { color: '#fff', fontSize: 16 },
  input: { backgroundColor: '#222', color: '#fff', padding: 12, borderRadius: 8, fontSize: 16 },
  button: { padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  editButton: { backgroundColor: '#fff' },
  saveButton: { backgroundColor: '#4CAF50' },
  buttonText: { fontWeight: 'bold', color: '#000' },
  cancelButton: { marginTop: 15, alignItems: 'center' },
  cancelText: { color: '#ff4444' },
  logoutButton: { marginTop: 40, padding: 15, alignItems: 'center' },
  logoutText: { color: '#ff4444', fontSize: 16, fontWeight: '600' }
});