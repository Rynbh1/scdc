import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput, TouchableOpacity, Alert } from 'react-native';
import { getKpiReports } from '../../src/services/ReportService';
import { updateProductPrice } from '../../src/services/ProductService';
import { useAuth } from '../../src/context/AuthContext';

export default function DashboardScreen() {
  const { userToken } = useAuth();
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [barcode, setBarcode] = useState('');
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      const data = await getKpiReports(userToken!);
      setReports(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!barcode || !newPrice) {
      Alert.alert("Erreur", "Veuillez remplir le code-barres et le prix.");
      return;
    }
    try {
      await updateProductPrice(barcode, parseFloat(newPrice));
      Alert.alert("Succès", `Le prix du produit ${barcode} est maintenant de ${newPrice}€`);
      setNewPrice('');
      setBarcode('');
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour le prix. Vérifiez vos accès.");
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#fff" /></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Espace Manager</Text>
      
      {/* SECTION MODIFICATION PRIX */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Modifier un prix</Text>
        <TextInput 
          style={styles.input}
          placeholder="Code-barres (EAN)"
          placeholderTextColor="#666"
          value={barcode}
          onChangeText={setBarcode}
        />
        <TextInput 
          style={styles.input}
          placeholder="Nouveau prix (€)"
          placeholderTextColor="#666"
          value={newPrice}
          keyboardType="numeric"
          onChangeText={setNewPrice}
        />
        <TouchableOpacity style={styles.button} onPress={handleUpdatePrice}>
          <Text style={styles.buttonText}>Appliquer le nouveau prix</Text>
        </TouchableOpacity>
      </View>

      {/* KPIs (Tes composants existants) */}
      <Text style={styles.sectionTitle}>Statistiques de vente</Text>
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.label}>Panier Moyen</Text>
          <Text style={styles.value}>{reports?.average_basket} €</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Fidélité</Text>
          <Text style={styles.value}>{reports?.customer_loyalty_rate} %</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  centered: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 24, marginTop: 40 },
  sectionCard: { backgroundColor: '#111', padding: 15, borderRadius: 12, marginBottom: 25, borderSize: 1, borderColor: '#333' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 15 },
  input: { backgroundColor: '#222', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 10 },
  button: { backgroundColor: '#fff', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: 'bold' },
  grid: { gap: 16 },
  card: { backgroundColor: '#111', padding: 20, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#fff' },
  label: { color: '#888', fontSize: 14, marginBottom: 4 },
  value: { color: '#fff', fontSize: 24, fontWeight: '700' }
});