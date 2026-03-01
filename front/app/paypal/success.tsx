import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import apiClient from '../../src/api/client';
import { useCart } from '../../src/context/CartContext';
import { useAccessibility } from '../../src/context/AccessibilityContext';

interface CheckoutPayloadItem {
  product_id: number;
  quantity: number;
}

interface BillingPayload {
  first_name: string;
  last_name: string;
  address: string;
  zip_code: string;
  city: string;
}

export default function PaypalSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ paypal_order_id?: string; items?: string; billing?: string }>();
  const { clearCart } = useCart();
  const { textScale, colors } = useAccessibility();
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const hasRequested = useRef(false);

  useEffect(() => {
    const capturePayment = async () => {
      if (hasRequested.current) return;
      hasRequested.current = true;

      if (!params.paypal_order_id || !params.items || !params.billing) {
        Alert.alert('Erreur', 'Informations de paiement incomplètes.');
        setLoading(false);
        return;
      }

      try {
        const parsedItems = JSON.parse(params.items) as CheckoutPayloadItem[];
        const parsedBilling = JSON.parse(params.billing) as BillingPayload;

        await apiClient.post('/invoices/checkout', {
          items: parsedItems,
          billing: parsedBilling,
          paypal_order_id: params.paypal_order_id,
        });

        clearCart();
        setCompleted(true);
      } catch (error: any) {
        Alert.alert('Erreur', error?.response?.data?.detail || 'Impossible de finaliser la commande.');
      } finally {
        setLoading(false);
      }
    };

    capturePayment();
  }, [params.paypal_order_id, params.items, params.billing, clearCart]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      {loading ? (
        <>
          <ActivityIndicator size="large" color={colors.textPrimary} />
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: 22 * textScale }]}>Validation du paiement...</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: 14 * textScale }]}>Nous finalisons votre commande.</Text>
        </>
      ) : completed ? (
        <>
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: 22 * textScale }]}>Paiement validé ✅</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: 14 * textScale }]}>Votre commande a été enregistrée avec succès.</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.buttonText}>Retour à l’accueil</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: 22 * textScale }]}>Échec de la validation</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: 14 * textScale }]}>Vous pouvez réessayer le paiement depuis le panier.</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)/cart')}>
            <Text style={styles.buttonText}>Retour au panier</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#aaa',
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
  },
});
