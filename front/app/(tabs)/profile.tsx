import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import apiClient from '../../src/api/client';
import { updateProfile } from '../../src/services/AuthService';
import { useAuth } from '../../src/context/AuthContext';
import { useAccessibility } from '../../src/context/AccessibilityContext';

export default function ProfileScreen() {
  const { signOut, userToken } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'infos' | 'history' | 'settings'>('infos');
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<any>(null);
  const [refreshingHistory, setRefreshingHistory] = useState(false);
  const { settings: accessibilitySettings, setSettings: setAccessibilitySettings, textScale, colors } = useAccessibility();
  const isManager = user?.role === 'manager';

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, historyRes] = await Promise.all([
        apiClient.get('/auth/me'),
        apiClient.get('/invoices/me')
      ]);
      setUser(profileRes.data);
      setEditedUser(profileRes.data);
      setInvoices(historyRes.data);
    } catch (error: any) {
      console.error(error);
      if (error?.response?.status === 401) {
        Alert.alert('Session expirée', 'Veuillez vous reconnecter.');
        await signOut();
      } else {
        Alert.alert("Erreur", "Impossible de charger les données");
      }
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    if (userToken) {
      fetchInitialData();
    }
  }, [userToken, fetchInitialData]);

  useEffect(() => {
    if (isManager && activeTab === 'history') {
      setActiveTab('infos');
    }
  }, [isManager, activeTab]);

  const handleSave = async () => {
    try {
      const updated = await updateProfile(editedUser);
      setUser(updated);
      setIsEditing(false);
      Alert.alert("Succès", "Profil mis à jour");
    } catch {
      Alert.alert("Erreur", "Échec de la mise à jour");
    }
  };

  const refreshHistory = async () => {
    setRefreshingHistory(true);
    try {
      const historyRes = await apiClient.get('/invoices/me');
      setInvoices(historyRes.data);
    } catch {
      Alert.alert('Erreur', "Impossible d'actualiser l'historique.");
    } finally {
      setRefreshingHistory(false);
    }
  };

  if (loading || !user) {
    return <View style={[styles.centered, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.textPrimary} size="large" /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: 32 * textScale }]}>Mon Compte</Text>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, { backgroundColor: colors.card, borderColor: colors.border }, activeTab === 'infos' && styles.activeTab]} 
          onPress={() => setActiveTab('infos')}
        >
          <Text style={[styles.tabText, { color: colors.textMuted, fontSize: 14 * textScale }, activeTab === 'infos' && styles.activeTabText]}>Mes Infos</Text>
        </TouchableOpacity>
        {!isManager && (
          <>
            <TouchableOpacity 
              style={[styles.tab, { backgroundColor: colors.card, borderColor: colors.border }, activeTab === 'history' && styles.activeTab]} 
              onPress={() => setActiveTab('history')}
            >
              <Text style={[styles.tabText, { color: colors.textMuted, fontSize: 14 * textScale }, activeTab === 'history' && styles.activeTabText]}>Historique</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, { backgroundColor: colors.card, borderColor: colors.border }, activeTab === 'settings' && styles.activeTab]} 
              onPress={() => setActiveTab('settings')}
            >
              <Text style={[styles.tabText, { color: colors.textMuted, fontSize: 14 * textScale }, activeTab === 'settings' && styles.activeTabText]}>Paramètres</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'infos' ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { label: 'Prénom', key: 'first_name' },
              { label: 'Nom', key: 'last_name' },
              { label: 'Téléphone', key: 'phone_number' },
              { label: 'Adresse', key: 'address' },
              { label: 'Ville', key: 'city' },
            ].map(field => (
              <View key={field.key} style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted, fontSize: 11 * textScale }]}>{field.label}</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedUser[field.key] || ''}
                    onChangeText={(val) => setEditedUser({ ...editedUser, [field.key]: val })}
                    placeholderTextColor="#444"
                  />
                ) : (
                  <Text style={[styles.value, { color: colors.textPrimary, fontSize: 17 * textScale }]}>{user[field.key] || 'Non renseigné'}</Text>
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
                <Text style={{color: colors.textMuted, fontSize: 14 * textScale}}>Annuler</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : activeTab === 'history' ? (
          <View>
            <TouchableOpacity style={styles.refreshButton} onPress={refreshHistory} disabled={refreshingHistory}>
              <Text style={[styles.refreshButtonText, { fontSize: 14 * textScale }]}>{refreshingHistory ? 'Actualisation...' : 'Actualiser l\'historique'}</Text>
            </TouchableOpacity>
            {invoices.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted, fontSize: 14 * textScale }]}>Aucune commande pour le moment.</Text>
            ) : (
              invoices.map((item) => (
                <View key={item.id} style={[styles.invoiceItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.invoiceDate, { color: colors.textPrimary, fontSize: 16 * textScale }]}>Commande #{item.id}</Text>
                    <Text style={[styles.invoiceDetails, { color: colors.textMuted, fontSize: 13 * textScale }]}>{item.items?.length || 0} articles</Text>
                    <Text style={[styles.invoiceDetails, { color: colors.textMuted, fontSize: 13 * textScale }]}>Paiement PayPal: {item.paypal_id || 'N/A'}</Text>
                    {(item.items || []).map((detail: any, idx: number) => (
                      <Text key={`${item.id}-${idx}`} style={[styles.invoiceLine, { color: colors.textSecondary, fontSize: 12 * textScale }]}>• {detail.product_name} x{detail.quantity} ({Number(detail.unit_price).toFixed(2)} €)</Text>
                    ))}
                  </View>
                  <Text style={[styles.invoicePrice, { color: colors.textPrimary, fontSize: 18 * textScale }]}>{Number(item.total_price).toFixed(2)} €</Text>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: 18 * textScale }]}>Accessibilité</Text>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary, fontSize: 16 * textScale }]}>Contraste élevé</Text>
              <Switch
                value={accessibilitySettings.highContrast}
                onValueChange={(value) => setAccessibilitySettings((prev) => ({ ...prev, highContrast: value }))}
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary, fontSize: 16 * textScale }]}>Texte plus grand</Text>
              <Switch
                value={accessibilitySettings.largeText}
                onValueChange={(value) => setAccessibilitySettings((prev) => ({ ...prev, largeText: value }))}
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary, fontSize: 16 * textScale }]}>Réduire les animations</Text>
              <Switch
                value={accessibilitySettings.reduceAnimations}
                onValueChange={(value) => setAccessibilitySettings((prev) => ({ ...prev, reduceAnimations: value }))}
              />
            </View>
            <Text style={[styles.settingsHint, { color: colors.textSecondary, fontSize: 12 * textScale }]}>Ces options sont appliquées immédiatement sur l’interface.</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={signOut}>
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
  invoiceLine: { color: '#bbb', fontSize: 12, marginTop: 2 },
  invoicePrice: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  emptyText: { color: '#444', textAlign: 'center', marginTop: 40 },
  refreshButton: { alignSelf: 'flex-start', marginBottom: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333', backgroundColor: '#1a1a1a' },
  refreshButtonText: { color: '#fff', fontWeight: '600' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  settingLabel: { color: '#fff', fontSize: 16 },
  settingsHint: { color: '#888', fontSize: 12, marginTop: 8 },
  logoutButton: { position: 'absolute', bottom: 30, left: 20, right: 20, padding: 18, borderRadius: 12, backgroundColor: '#111', borderWidth: 1, borderColor: '#300', alignItems: 'center' },
  logoutText: { color: '#ff4444', fontWeight: 'bold' }
});
