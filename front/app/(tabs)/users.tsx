import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Modal, Alert } from 'react-native';
import { createUserByManager, deleteUserByManager, getUserDetail, listUsers, updateUserByManager } from '../../src/services/UserService';

export default function UsersManagementScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [form, setForm] = useState<any>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'client',
  });

  const fetchUsers = useCallback(async () => {
    try {
      const data = await listUsers(query ? { q: query } : undefined);
      setUsers(data || []);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    }
  }, [query]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openDetail = async (user: any) => {
    try {
      const detail = await getUserDetail(user.id);
      setSelectedUser(detail.user);
      setHistory(detail.purchase_payment_history || []);
      setDetailVisible(true);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger le détail utilisateur');
    }
  };

  const handleCreate = async () => {
    if (!form.email || !form.password) {
      Alert.alert('Erreur', 'Email et mot de passe requis');
      return;
    }
    try {
      await createUserByManager(form);
      setCreateVisible(false);
      setForm({ first_name: '', last_name: '', email: '', password: '', role: 'client' });
      fetchUsers();
    } catch {
      Alert.alert('Erreur', 'Création impossible');
    }
  };

  const handleRoleToggle = async (user: any) => {
    try {
      await updateUserByManager(user.id, { role: user.role === 'manager' ? 'client' : 'manager' });
      fetchUsers();
    } catch {
      Alert.alert('Erreur', 'Mise à jour impossible');
    }
  };

  const handleDelete = (user: any) => {
    Alert.alert('Confirmation', `Supprimer ${user.email} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUserByManager(user.id);
            fetchUsers();
          } catch {
            Alert.alert('Erreur', 'Suppression impossible');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestion Utilisateurs</Text>

      <View style={styles.searchRow}>
        <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="Rechercher (nom/email)" placeholderTextColor="#666" />
        <TouchableOpacity style={styles.btn} onPress={fetchUsers}><Text style={styles.btnText}>Chercher</Text></TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.btn, { marginBottom: 12 }]} onPress={() => setCreateVisible(true)}>
        <Text style={styles.btnText}>Créer un utilisateur</Text>
      </TouchableOpacity>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
            <Text style={styles.meta}>{item.email} • {item.role}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => openDetail(item)}><Text style={styles.link}>Historique</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => handleRoleToggle(item)}><Text style={styles.link}>Basculer rôle</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)}><Text style={[styles.link, { color: '#ff6b6b' }]}>Supprimer</Text></TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={detailVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Historique utilisateur</Text>
          {selectedUser && <Text style={styles.meta}>{selectedUser.email}</Text>}
          <FlatList
            data={history}
            keyExtractor={(item) => item.invoice_id.toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.name}>Facture #{item.invoice_id}</Text>
                <Text style={styles.meta}>Montant: {Number(item.total_price).toFixed(2)} €</Text>
                <Text style={styles.meta}>Paiement: {item.paypal_id || 'N/A'}</Text>
                {(item.items || []).map((it: any, idx: number) => (
                  <Text key={`${item.invoice_id}-${idx}`} style={styles.meta}>- {it.product_name} x{it.quantity} ({it.unit_price_at_sale}€)</Text>
                ))}
              </View>
            )}
            ListEmptyComponent={<Text style={styles.meta}>Aucun historique.</Text>}
          />
          <TouchableOpacity style={styles.btn} onPress={() => setDetailVisible(false)}><Text style={styles.btnText}>Fermer</Text></TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={createVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.name}>Nouveau compte</Text>
            <TextInput style={styles.input} placeholder="Prénom" placeholderTextColor="#666" value={form.first_name} onChangeText={(v) => setForm({ ...form, first_name: v })} />
            <TextInput style={styles.input} placeholder="Nom" placeholderTextColor="#666" value={form.last_name} onChangeText={(v) => setForm({ ...form, last_name: v })} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Mot de passe" placeholderTextColor="#666" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} />
            <TextInput style={styles.input} placeholder="Role (client/manager)" placeholderTextColor="#666" value={form.role} onChangeText={(v) => setForm({ ...form, role: v })} />
            <TouchableOpacity style={styles.btn} onPress={handleCreate}><Text style={styles.btnText}>Créer</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#222' }]} onPress={() => setCreateVisible(false)}><Text style={styles.btnText}>Annuler</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16, paddingTop: 60 },
  modalContainer: { flex: 1, backgroundColor: '#000', padding: 16, paddingTop: 60 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: { flex: 1, backgroundColor: '#111', borderColor: '#333', borderWidth: 1, color: '#fff', borderRadius: 10, padding: 10, marginBottom: 8 },
  btn: { backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'center' },
  btnText: { color: '#000', fontWeight: '700' },
  card: { backgroundColor: '#111', borderRadius: 12, padding: 12, marginBottom: 10, borderColor: '#222', borderWidth: 1 },
  name: { color: '#fff', fontWeight: '700', fontSize: 16 },
  meta: { color: '#aaa', marginTop: 2 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  link: { color: '#8ab4ff', fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#111', borderRadius: 14, padding: 16, borderColor: '#333', borderWidth: 1 },
});
