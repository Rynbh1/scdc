import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { getKpiReports } from '../../src/services/ReportService';
import { useAuth } from '../../src/context/AuthContext';

export default function DashboardScreen() {
  const { userToken } = useAuth();
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchKPIs();
  }, []);

  if (loading) {
      return (
        <View style={{flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      );
    }

  // --- SÉCURITÉ ANTI-CRASH ---
  if (!reports) {
    return (
      <View style={{flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{color: '#fff'}}>Aucune donnée disponible.</Text>
        <Text style={{color: '#666', marginTop: 10}}>Vérifiez votre connexion internet.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>État du Magasin</Text>
      
      <View style={styles.grid}>
        {/* KPI 1 : Panier Moyen */}
        <View style={styles.card}>
          <Text style={styles.label}>Panier Moyen</Text>
          <Text style={styles.value}>{reports.average_basket} €</Text>
        </View>

        {/* KPI 3 : Rupture de stock */}
        <View style={[styles.card, reports.stock_rupture_rate > 20 && styles.warningCard]}>
          <Text style={styles.label}>Rupture Stock</Text>
          <Text style={styles.value}>{reports.stock_rupture_rate} %</Text>
        </View>

        {/* KPI 5 : Fidélité */}
        <View style={styles.card}>
          <Text style={styles.label}>Fidélité Client</Text>
          <Text style={styles.value}>{reports.customer_loyalty_rate} %</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  centered: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 24, marginTop: 40 },
  grid: { gap: 16 },
  card: { 
    backgroundColor: '#111', 
    padding: 24, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#222' 
  },
  warningCard: { borderColor: '#552222' }, // Légère alerte si trop de rupture
  label: { color: '#888', fontSize: 14, marginBottom: 8, textTransform: 'uppercase' },
  value: { color: '#fff', fontSize: 32, fontWeight: '600' }
});