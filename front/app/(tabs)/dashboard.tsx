import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { getKpiReports } from '../../src/services/ReportService';

export default function DashboardScreen() {
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchKPIs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getKpiReports();
      setReports(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Dashboard KPI Manager</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.label}>Panier Moyen</Text>
          <Text style={styles.value}>{Number(reports?.average_basket || 0).toFixed(2)} €</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Taux de Rupture</Text>
          <Text style={styles.value}>{Number(reports?.stock_rupture_rate || 0).toFixed(2)}%</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Taux de Fidélité</Text>
          <Text style={styles.value}>{Number(reports?.customer_loyalty_rate || 0).toFixed(2)}%</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Top 5 Produits les plus vendus</Text>
      {(reports?.top_products || []).length === 0 ? (
        <Text style={styles.emptyText}>Aucune vente enregistrée.</Text>
      ) : (
        reports.top_products.map((item: any, index: number) => (
          <View key={`${item.product_id}-${index}`} style={styles.row}>
            <Text style={styles.rowTitle}>{index + 1}. {item.name}</Text>
            <Text style={styles.rowValue}>{item.total_sold}</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Chiffre d’affaires par catégorie</Text>
      {(reports?.revenue_by_category || []).length === 0 ? (
        <Text style={styles.emptyText}>Aucun chiffre d’affaires par catégorie.</Text>
      ) : (
        reports.revenue_by_category.map((item: any, index: number) => (
          <View key={`${item.category}-${index}`} style={styles.row}>
            <Text style={styles.rowTitle}>{item.category}</Text>
            <Text style={styles.rowValue}>{Number(item.revenue || 0).toFixed(2)} €</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  centered: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 24, marginTop: 40 },
  grid: { gap: 12, marginBottom: 20 },
  card: { backgroundColor: '#111', padding: 20, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#fff' },
  label: { color: '#888', fontSize: 14, marginBottom: 4 },
  value: { color: '#fff', fontSize: 24, fontWeight: '700' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 10, marginBottom: 10 },
  row: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: { color: '#fff', flex: 1, paddingRight: 10 },
  rowValue: { color: '#fff', fontWeight: '700' },
  emptyText: { color: '#666', marginBottom: 8 },
});