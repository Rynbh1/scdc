import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useCart } from '../../src/context/CartContext';
import apiClient from '../../src/api/client';

export default function CartScreen() {
  const { items, totalAmount, removeFromCart, clearCart, setItemQuantity } = useCart();
  const [billing, setBilling] = useState({ first_name: '', last_name: '', address: '', zip_code: '', city: '' });
  const [loading, setLoading] = useState(false);

  const canCheckout = useMemo(() => {
    return items.length > 0 && billing.first_name && billing.last_name && billing.address && billing.zip_code && billing.city;
  }, [items.length, billing]);

  const handleCheckout = async () => {
    if (!canCheckout) {
      Alert.alert('Erreur', 'Complétez le formulaire de facturation et le panier.');
      return;
    }

    setLoading(true);
    try {
      const payloadItems = items.map((i) => ({ product_id: i.id, quantity: i.quantity }));
      const createOrderRes = await apiClient.post('/invoices/paypal/create-order', payloadItems);
      const order = createOrderRes.data?.paypal;
      const orderId = createOrderRes.data?.paypal_order_id;

      const approveUrl = order?.links?.find((l: any) => l.rel === 'approve')?.href;
      if (approveUrl) {
        await WebBrowser.openBrowserAsync(approveUrl);
      }

      await apiClient.post('/invoices/checkout', {
        items: payloadItems,
        billing,
        paypal_order_id: orderId,
      });

      Alert.alert('Succès', 'Paiement validé et commande enregistrée.');
      clearCart();
    } catch (error: any) {
      Alert.alert('Erreur', error?.response?.data?.detail || 'Impossible de finaliser la commande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Mon Panier</Text>

        <FlatList
          data={items}
          scrollEnabled={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDetails}>Prix unitaire: {item.price.toFixed(2)} €</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setItemQuantity(item.id, item.quantity - 1)}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setItemQuantity(item.id, item.quantity + 1)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemDetails}>Sous-total: {(item.price * item.quantity).toFixed(2)} €</Text>
              </View>
              <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                <Text style={styles.removeText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Votre panier est vide</Text>}
        />

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Facturation</Text>
          <TextInput style={styles.input} placeholder="Prénom" placeholderTextColor="#666" value={billing.first_name} onChangeText={(v) => setBilling({ ...billing, first_name: v })} />
          <TextInput style={styles.input} placeholder="Nom" placeholderTextColor="#666" value={billing.last_name} onChangeText={(v) => setBilling({ ...billing, last_name: v })} />
          <TextInput style={styles.input} placeholder="Adresse" placeholderTextColor="#666" value={billing.address} onChangeText={(v) => setBilling({ ...billing, address: v })} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Code postal" placeholderTextColor="#666" value={billing.zip_code} onChangeText={(v) => setBilling({ ...billing, zip_code: v })} />
            <TextInput style={[styles.input, { flex: 2 }]} placeholder="Ville" placeholderTextColor="#666" value={billing.city} onChangeText={(v) => setBilling({ ...billing, city: v })} />
          </View>
          <Text style={styles.total}>Total : {totalAmount.toFixed(2)} €</Text>
          <TouchableOpacity style={[styles.checkoutBtn, (!canCheckout || loading) && { opacity: 0.5 }]} onPress={handleCheckout} disabled={!canCheckout || loading}>
            <Text style={styles.checkoutText}>{loading ? 'Paiement...' : 'Payer avec PayPal'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  item: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#111', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#222' },
  itemName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  itemDetails: { color: '#888', marginTop: 4 },
  removeText: { color: '#ff4444', marginLeft: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { color: '#fff', fontWeight: 'bold' },
  qtyText: { color: '#fff', fontWeight: '700' },
  formCard: { marginTop: 20, backgroundColor: '#111', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#222' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: { backgroundColor: '#222', color: '#fff', borderRadius: 8, padding: 12, marginBottom: 8 },
  total: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'right', marginVertical: 10 },
  checkoutBtn: { backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center' },
  checkoutText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  empty: { color: '#444', textAlign: 'center', marginTop: 20 },
});