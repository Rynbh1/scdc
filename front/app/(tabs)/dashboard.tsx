import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { getKpiReports } from '../../src/services/ReportService';
import { useAuth } from '../../src/context/AuthContext';

export default function DashboardScreen() {
  const { userToken } = useAuth();
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);


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

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#fff" /></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Espace Manager</Text>
      
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
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 15 },
  grid: { gap: 16 },
  card: { backgroundColor: '#111', padding: 20, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#fff' },
  label: { color: '#888', fontSize: 14, marginBottom: 4 },
  value: { color: '#fff', fontSize: 24, fontWeight: '700' }
});