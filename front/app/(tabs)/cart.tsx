import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useCart } from '../../src/context/CartContext';
import apiClient from '../../src/api/client';

export default function CartScreen() {
  const { items, totalAmount, removeFromCart, clearCart } = useCart();

  const handleCheckout = async () => {
    if (items.length === 0) return;

    try {
      const payload = {
        items: items.map(i => ({ product_id: i.id, quantity: i.quantity }))
      };
      
      await apiClient.post('/invoices/', payload);
      
      Alert.alert("Succès", "Commande validée !");
      clearCart();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de valider la commande");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon Panier</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetails}>Qté: {item.quantity} - {(item.price * item.quantity).toFixed(2)} €</Text>
            </View>
            <TouchableOpacity onPress={() => removeFromCart(item.id)}>
              <Text style={styles.removeText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Votre panier est vide</Text>}
      />

      <View style={styles.footer}>
        <Text style={styles.total}>Total : {totalAmount.toFixed(2)} €</Text>
        <TouchableOpacity 
          style={[styles.checkoutBtn, items.length === 0 && { opacity: 0.5 }]} 
          onPress={handleCheckout}
          disabled={items.length === 0}
        >
          <Text style={styles.checkoutText}>Payer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  item: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#111', padding: 15, borderRadius: 10, marginBottom: 10 },
  itemName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  itemDetails: { color: '#888', marginTop: 4 },
  removeText: { color: '#ff4444' },
  footer: { borderTopWidth: 1, borderTopColor: '#222', paddingTop: 20, marginBottom: 20 },
  total: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'right', marginBottom: 15 },
  checkoutBtn: { backgroundColor: '#fff', padding: 18, borderRadius: 12, alignItems: 'center' },
  checkoutText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  empty: { color: '#444', textAlign: 'center', marginTop: 50 }
});