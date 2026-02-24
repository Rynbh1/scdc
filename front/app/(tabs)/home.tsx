import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Modal, Image, Alert, ActivityIndicator, Keyboard, FlatList, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { listProducts, scanProduct, searchProduct, updateProductStock } from '../../src/services/ProductService';
import { useCart } from '../../src/context/CartContext';
import { useAuth } from '../../src/context/AuthContext';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResultsList, setShowResultsList] = useState(false);
  const [dbProducts, setDbProducts] = useState<any[]>([]);

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
      const data = await listProducts({ page: 1, page_size: 30, sort_by: 'name', sort_order: 'asc' });
      setDbProducts(data?.items || []);
    } catch {
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
    setIsCameraOpen(true);
  };

  const openProductModal = (data: any) => {
    setProduct(data);
    setQuantityInput('1');
    setManagerPrice(String(data.price ?? ''));
    setManagerStock(String(data.available_quantity ?? 0));
    setIsModalVisible(true);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanInProgressRef.current) return;
    scanInProgressRef.current = true;
    setIsCameraOpen(false);

    try {
      const scannedProduct = await scanProduct(data);
      if (!scannedProduct) {
        Alert.alert('Inconnu', 'Produit non trouvé.');
        return;
      }
      openProductModal(scannedProduct);
      loadDbProducts();
    } catch {
      Alert.alert('Erreur', 'Produit non trouvé.');
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
    setLoading(true);
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
    } finally {
      setLoading(false);
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
    <TouchableOpacity style={styles.resultItem} onPress={() => openProductModal(item)}>
      <Image source={{ uri: item.picture || 'https://via.placeholder.com/50' }} style={styles.thumbnail} />
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.resultBrand}>{item.brand || 'Marque inconnue'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.title}>Scanner</Text>
          <View style={styles.searchContainer}>
            <TextInput style={styles.searchInput} placeholder="Rechercher (riz, coca...)" placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={handleSearch} returnKeyType="search" />
            <TouchableOpacity onPress={searchQuery.length > 0 ? () => setSearchQuery('') : handleSearch} style={styles.searchIcon}>
              <Ionicons name={searchQuery.length > 0 ? 'close-circle' : 'search'} size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {loading ? <ActivityIndicator size="large" color="#fff" /> : showResultsList ? (
            <FlatList data={searchResults} keyExtractor={(item, index) => item.off_id || index.toString()} renderItem={renderResultItem} keyboardShouldPersistTaps="handled" />
          ) : (
            <>
              <TouchableOpacity style={styles.scanButton} onPress={handleOpenScanner}><Text style={styles.scanButtonText}>ACTIVER LA CAMÉRA</Text></TouchableOpacity>
              <View style={styles.dbHeader}>
                <Text style={styles.dbTitle}>Produits déjà en base</Text>
                <TouchableOpacity onPress={loadDbProducts}><Ionicons name="refresh" size={18} color="#fff" /></TouchableOpacity>
              </View>
              {dbLoading ? <ActivityIndicator color="#fff" /> : (
                <FlatList data={dbProducts} keyExtractor={(item) => item.id.toString()} renderItem={renderResultItem} style={{ marginTop: 8 }} keyboardShouldPersistTaps="handled" />
              )}
            </>
          )}
        </View>

        <Modal visible={isCameraOpen} animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'black' }}>
            <CameraView style={StyleSheet.absoluteFillObject} facing="back" onBarcodeScanned={handleBarCodeScanned} />
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsCameraOpen(false)}><Ionicons name="close" size={30} color="#000" /></TouchableOpacity>
          </View>
        </Modal>

        <Modal visible={isModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {product && (
                <>
                  <Image source={{ uri: product.picture || 'https://via.placeholder.com/150' }} style={styles.productImage} />
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productBrand}>{product.brand}</Text>
                  <Text style={styles.info}>Marque: {product.brand || 'N/A'}</Text>
                  <Text style={styles.info}>Catégorie: {product.category || 'N/A'}</Text>
                  <Text style={styles.info}>Infos nutritionnelles: {product.nutritional_info || 'N/A'}</Text>
                  {isManager ? (
                    <>
                      <TextInput style={styles.input} value={managerPrice} onChangeText={setManagerPrice} placeholder="Prix (€)" keyboardType="numeric" placeholderTextColor="#666" />
                      <TextInput style={styles.input} value={managerStock} onChangeText={setManagerStock} placeholder="Stock" keyboardType="numeric" placeholderTextColor="#666" />
                      <TouchableOpacity style={styles.addToCartButton} onPress={handleManagerSave}><Text style={styles.addToCartText}>Enregistrer en base</Text></TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.info}>Prix: {Number(product.price || 0).toFixed(2)} €</Text>
                      <Text style={styles.info}>Stock: {product.available_quantity ?? 0}</Text>
                      <TextInput style={styles.input} value={quantityInput} onChangeText={setQuantityInput} placeholder="Quantité" keyboardType="numeric" placeholderTextColor="#666" />
                      <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}><Text style={styles.addToCartText}>Ajouter au panier</Text></TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity onPress={() => setIsModalVisible(false)} style={{ marginTop: 12 }}><Text style={{ color: '#666' }}>Fermer</Text></TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 60, paddingHorizontal: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 20 },
  searchContainer: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 15, alignItems: 'center', height: 50 },
  searchInput: { flex: 1, color: '#fff' },
  searchIcon: { padding: 5 },
  content: { flex: 1 },
  scanButton: { backgroundColor: '#fff', padding: 18, borderRadius: 30, alignItems: 'center', marginBottom: 14 },
  scanButtonText: { color: '#000', fontWeight: '700' },
  dbHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  dbTitle: { color: '#fff', fontWeight: '700' },
  resultItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 12, borderRadius: 12, marginBottom: 10 },
  thumbnail: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#fff' },
  resultInfo: { flex: 1, marginLeft: 15 },
  resultName: { color: '#fff', fontWeight: 'bold' },
  resultBrand: { color: '#888' },
  closeButton: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#fff', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
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
