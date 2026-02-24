import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, FlatList } from 'react-native';
import apiClient from '../../src/api/client';
import { updateProfile } from '../../src/services/AuthService';
import { useAuth } from '../../src/context/AuthContext';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'infos' | 'history'>('infos');
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [profileRes, historyRes] = await Promise.all([
        apiClient.get('/auth/me'),
        apiClient.get('/invoices/me')
      ]);
      setUser(profileRes.data);
      setEditedUser(profileRes.data);
      setInvoices(historyRes.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const updated = await updateProfile(editedUser);
      setUser(updated);
      setIsEditing(false);
      Alert.alert("Succès", "Profil mis à jour");
    } catch (error) {
      Alert.alert("Erreur", "Échec de la mise à jour");
    }
  };

  if (loading || !user) {
    return <View style={styles.centered}><ActivityIndicator color="#fff" size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Mon Compte</Text>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'infos' && styles.activeTab]} 
          onPress={() => setActiveTab('infos')}
        >
          <Text style={[styles.tabText, activeTab === 'infos' && styles.activeTabText]}>Mes Infos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]} 
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Historique</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'infos' ? (
          <View style={styles.card}>
            {[
              { label: 'Prénom', key: 'first_name' },
              { label: 'Nom', key: 'last_name' },
              { label: 'Téléphone', key: 'phone_number' },
              { label: 'Adresse', key: 'address' },
              { label: 'Ville', key: 'city' },
            ].map(field => (
              <View key={field.key} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedUser[field.key] || ''}
                    onChangeText={(val) => setEditedUser({ ...editedUser, [field.key]: val })}
                    placeholderTextColor="#444"
                  />
                ) : (
                  <Text style={styles.value}>{user[field.key] || 'Non renseigné'}</Text>
                )}
              </View>
            ))}
            
            <TouchableOpacity 
              style={[styles.mainButton, isEditing ? styles.saveBtn : styles.editBtn]} 
              onPress={isEditing ? handleSave : () => setIsEditing(true)}
            >
              <Text style={styles.mainButtonText}>{isEditing ? "Enregistrer" : "Modifier mes informations"}</Text>
            </TouchableOpacity>
            {isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
                <Text style={{color: '#666'}}>Annuler</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View>
            {invoices.length === 0 ? (
              <Text style={styles.emptyText}>Aucune commande pour le moment.</Text>
            ) : (
              invoices.map((item) => (
                <View key={item.id} style={styles.invoiceItem}>
                  <View>
                    <Text style={styles.invoiceDate}>Commande #{item.id}</Text>
                    <Text style={styles.invoiceDetails}>{item.items?.length || 0} articles</Text>
                  </View>
                  <Text style={styles.invoicePrice}>{item.total_price.toFixed(2)} €</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 60 },
  centered: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', paddingHorizontal: 20, marginBottom: 20 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#111' },
  activeTab: { backgroundColor: '#fff' },
  tabText: { color: '#888', fontWeight: '600' },
  activeTabText: { color: '#000' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { backgroundColor: '#111', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#222' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#555', fontSize: 11, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 },
  value: { color: '#fff', fontSize: 17 },
  input: { color: '#fff', fontSize: 17, borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 4 },
  mainButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  editBtn: { backgroundColor: '#222' },
  saveBtn: { backgroundColor: '#fff' },
  mainButtonText: { fontWeight: '700', color: '#fff' },
  cancelBtn: { alignItems: 'center', marginTop: 15 },
  invoiceItem: { backgroundColor: '#111', padding: 20, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  invoiceDate: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  invoiceDetails: { color: '#666', fontSize: 13, marginTop: 2 },
  invoicePrice: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  emptyText: { color: '#444', textAlign: 'center', marginTop: 40 },
  logoutButton: { position: 'absolute', bottom: 30, left: 20, right: 20, padding: 18, borderRadius: 12, backgroundColor: '#111', borderWidth: 1, borderColor: '#300', alignItems: 'center' },
  logoutText: { color: '#ff4444', fontWeight: 'bold' }
});