import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
  Keyboard,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import {
  ProductApiError,
  getRecommendations,
  listProducts,
  scanProduct,
  searchProduct,
  updateProductStock,
} from '../../src/services/ProductService';
import { useCart } from '../../src/context/CartContext';
import { useAuth } from '../../src/context/AuthContext';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResultsList, setShowResultsList] = useState(false);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const [product, setProduct] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [quantityInput, setQuantityInput] = useState('1');
  const [managerPrice, setManagerPrice] = useState('');
  const [managerStock, setManagerStock] = useState('0');

  const scanInProgressRef = useRef(false);

  const { addToCart } = useCart();
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const loadDbProducts = async () => {
    setDbLoading(true);
    try {
      const [stock, recommendations] = await Promise.all([
        listProducts({ page: 1, page_size: 30, sort_by: 'name', sort_order: 'asc' }),
        getRecommendations({ limit: 6 }),
      ]);
      setDbProducts(stock?.items || []);
      setRecommendedProducts(recommendations?.items || []);
    } catch {
      setNotification('Mode dégradé: affichage des données en cache.');
      setDbProducts([]);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    loadDbProducts();
  }, []);

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission', 'Accès caméra requis.');
        return;
      }
    }
    scanInProgressRef.current = false;
    setNotification('Astuce: activez la lampe torche si la luminosité est faible.');
    setIsCameraOpen(true);
  };

  const openProductModal = (data: any) => {
    setProduct(data);
    setQuantityInput('1');
    setManagerPrice(String(data.price ?? ''));
    setManagerStock(String(data.available_quantity ?? 0));
    setIsModalVisible(true);

    if ((data.available_quantity ?? 0) <= 0) {
      setNotification('Produit scanné indisponible en stock.');
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanInProgressRef.current) return;
    scanInProgressRef.current = true;
    setIsCameraOpen(false);

    try {
      const scannedProduct = await scanProduct(data);
      if (!scannedProduct) {
        Alert.alert('Inconnu', 'Produit non trouvé.');
        setNotification('Scan sans résultat: produit absent du stock.');
        return;
      }
      openProductModal(scannedProduct);
      loadDbProducts();
    } catch (error) {
      if (error instanceof ProductApiError && error.code === 'PRODUCT_NOT_FOUND') {
        Alert.alert('Produit inconnu', "Ce code-barres n'existe pas dans le stock.");
        setNotification('Notification: produit scanné absent du stock.');
      } else {
        Alert.alert('Erreur', 'Service de scan indisponible. Vérifiez la connexion.');
        setNotification('Mode hors-ligne: impossible de vérifier un nouveau produit.');
      }
    } finally {
      setTimeout(() => {
        scanInProgressRef.current = false;
      }, 500);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    fetchProduct(searchQuery, 'search');
  };

  const fetchProduct = async (identifier: string, type: 'scan' | 'search') => {
    setSearchResults([]);
    try {
      if (type === 'scan') {
        const data = await scanProduct(identifier);
        if (data) openProductModal(data);
      } else {
        const results = await searchProduct(identifier);
        if (results?.length > 0) {
          setSearchResults(results);
          setShowResultsList(true);
        } else {
          Alert.alert('Oups', 'Aucun produit trouvé pour cette recherche.');
        }
      }
    } catch {
      Alert.alert('Erreur', 'Problème de connexion.');
      setNotification('Résultat indisponible: problème réseau.');
    } finally {
      // noop
    }
  };

  const handleManagerSave = async () => {
    const barcode = product?.off_id;
    const parsedPrice = parseFloat(managerPrice);
    const parsedStock = parseInt(managerStock, 10);

    if (!barcode || Number.isNaN(parsedPrice) || Number.isNaN(parsedStock) || parsedPrice <= 0 || parsedStock < 0) {
      Alert.alert('Erreur', 'Prix ou quantité invalide.');
      return;
    }

    try {
      const res = await updateProductStock(barcode, parsedPrice, parsedStock);
      setProduct({ ...product, price: parsedPrice, available_quantity: parsedStock, id: res?.product?.id ?? product.id });
      Alert.alert('Succès', 'Produit enregistré en base avec prix et stock.');
      setIsModalVisible(false);
      loadDbProducts();
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer le produit.");
    }
  };

  const handleAddToCart = () => {
    const desiredQty = parseInt(quantityInput, 10);
    const stock = Number(product.available_quantity || 0);

    if (Number.isNaN(desiredQty) || desiredQty <= 0) {
      Alert.alert('Erreur', 'Quantité invalide.');
      return;
    }
    if (stock <= 0) {
      Alert.alert('Stock', 'Produit indisponible.');
      setNotification('Alerte stock: produit indisponible.');
      return;
    }
    if (desiredQty > stock) {
      Alert.alert('Stock insuffisant', `Quantité max disponible: ${stock}`);
      return;
    }

    const added = addToCart(product, desiredQty);
    if (!added) {
      Alert.alert('Stock insuffisant', 'La quantité demandée dépasse le stock disponible.');
      return;
    }

    setIsModalVisible(false);
    Alert.alert('Succès', `${product.name} ajouté (${desiredQty}) au panier !`);
  };

  const renderResultItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => openProductModal(item)}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${item.name}`}
    >
      <Image source={{ uri: item.picture || 'https://via.placeholder.com/50' }} style={styles.thumbnail} />
      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Text style={styles.resultBrand}>{item.brand || 'Marque inconnue'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">Scanner Produit</Text>
          {notification ? <Text style={styles.notification}>{notification}</Text> : null}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un produit..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              accessibilityLabel="Champ de recherche produit"
            />
            <TouchableOpacity style={styles.searchIcon} onPress={handleSearch} accessibilityRole="button" accessibilityLabel="Lancer la recherche">
              <Ionicons name="search" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <TouchableOpacity style={styles.scanButton} onPress={handleOpenScanner} accessibilityRole="button" accessibilityLabel="Activer la caméra pour scanner">
            <Text style={styles.scanButtonText}>ACTIVER LA CAMÉRA</Text>
          </TouchableOpacity>

          <Text style={styles.dbTitle}>Suggestions produits</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recoRow}>
            {recommendedProducts.map((item) => (
              <TouchableOpacity key={item.id || item.off_id} style={styles.recoCard} onPress={() => openProductModal(item)}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultBrand}>Stock: {item.available_quantity ?? 0}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.dbHeader}>
            <Text style={styles.dbTitle}>Produits en base</Text>
            {dbLoading && <ActivityIndicator color="#fff" />}
          </View>
          <FlatList data={showResultsList ? searchResults : dbProducts} keyExtractor={(item, index) => String(item.id || item.off_id || index)} renderItem={renderResultItem} />
        </View>

        <Modal visible={isCameraOpen} transparent={false} animationType="slide" onRequestClose={() => setIsCameraOpen(false)}>
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <CameraView style={{ flex: 1 }} onBarcodeScanned={handleBarCodeScanned} facing="back" enableTorch={torchEnabled} />
            <View style={styles.cameraActions}>
              <TouchableOpacity style={styles.controlButton} onPress={() => setTorchEnabled((value) => !value)}>
                <Text style={styles.scanButtonText}>{torchEnabled ? 'Lampe OFF' : 'Lampe ON'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={() => setIsCameraOpen(false)}>
                <Text style={styles.scanButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={() => setIsModalVisible(false)}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.modalOverlay}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%', alignItems: 'center' }}>
                <View style={styles.modalCard}>
                  <ScrollView contentContainerStyle={{ alignItems: 'center' }} style={{ width: '100%' }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    {product && (
                      <>
                        <Image source={{ uri: product.picture || 'https://via.placeholder.com/150' }} style={styles.productImage} />
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productBrand}>{product.brand}</Text>
                        <Text style={styles.info}>Catégorie: {product.category || 'N/A'}</Text>

                        {isManager ? (
                          <>
                            <TextInput style={styles.input} value={managerPrice} onChangeText={setManagerPrice} placeholder="Prix (€)" keyboardType="numeric" placeholderTextColor="#666" />
                            <TextInput style={styles.input} value={managerStock} onChangeText={setManagerStock} placeholder="Stock" keyboardType="numeric" placeholderTextColor="#666" />
                            <TouchableOpacity style={styles.addToCartButton} onPress={handleManagerSave}>
                              <Text style={styles.addToCartText}>Enregistrer en base</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <>
                            <Text style={styles.info}>Prix: {Number(product.price || 0).toFixed(2)} €</Text>
                            <Text style={styles.info}>Stock: {product.available_quantity ?? 0}</Text>
                            <TextInput style={styles.input} value={quantityInput} onChangeText={setQuantityInput} placeholder="Quantité" keyboardType="numeric" placeholderTextColor="#666" />
                            <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
                              <Text style={styles.addToCartText}>Ajouter au panier</Text>
                            </TouchableOpacity>
                          </>
                        )}

                        <TouchableOpacity onPress={() => setIsModalVisible(false)} style={{ marginTop: 15, padding: 10 }}>
                          <Text style={{ color: '#888' }}>Fermer</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </ScrollView>
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 60, paddingHorizontal: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 20 },
  notification: { color: '#9be7a5', marginBottom: 12 },
  searchContainer: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 15, alignItems: 'center', height: 50 },
  searchInput: { flex: 1, color: '#fff' },
  searchIcon: { padding: 5 },
  content: { flex: 1 },
  scanButton: { backgroundColor: '#fff', padding: 18, borderRadius: 30, alignItems: 'center', marginBottom: 14 },
  scanButtonText: { color: '#000', fontWeight: '700' },
  dbHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  dbTitle: { color: '#fff', fontWeight: '700', marginBottom: 8 },
  recoRow: { marginBottom: 12 },
  recoCard: { backgroundColor: '#111', padding: 12, borderRadius: 12, marginRight: 10, minWidth: 140 },
  resultItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 12, borderRadius: 12, marginBottom: 10 },
  thumbnail: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#fff' },
  resultInfo: { flex: 1, marginLeft: 15 },
  resultName: { color: '#fff', fontWeight: 'bold' },
  resultBrand: { color: '#888' },
  cameraActions: { position: 'absolute', bottom: 20, width: '100%', flexDirection: 'row', justifyContent: 'space-evenly' },
  controlButton: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: '#111', borderRadius: 20, padding: 25, alignItems: 'center' },
  productImage: { width: 100, height: 100, resizeMode: 'contain', marginBottom: 12, backgroundColor: '#fff' },
  productName: { color: '#fff', fontWeight: 'bold', fontSize: 20, textAlign: 'center' },
  productBrand: { color: '#888', marginBottom: 12 },
  info: { color: '#fff', marginBottom: 8 },
  input: { width: '100%', backgroundColor: '#222', color: '#fff', borderRadius: 8, padding: 10, marginBottom: 10 },
  addToCartButton: { backgroundColor: '#fff', width: '100%', padding: 14, borderRadius: 12, alignItems: 'center' },
  addToCartText: { color: '#000', fontWeight: 'bold' },
});
