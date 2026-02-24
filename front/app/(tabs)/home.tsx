import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, TextInput, 
  Modal, Image, Alert, ActivityIndicator, Keyboard, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { scanProduct, searchProduct } from '../../src/services/ProductService';
import { useCart } from '../../src/context/CartContext';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResultsList, setShowResultsList] = useState(false);

  const [product, setProduct] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { addToCart } = useCart();

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Permission", "Accès caméra requis.");
        return;
      }
    }
    setScanned(false);
    setIsCameraOpen(true);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setIsCameraOpen(false);

    try {
      const scannedProduct = await scanProduct(data);

      if (!scannedProduct) {
        Alert.alert('Inconnu', 'Produit non trouvé.');
        return;
      }

      setProduct(scannedProduct);
      setIsModalVisible(true);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        Alert.alert('Session expirée', 'Veuillez vous reconnecter.');
      } else {
        Alert.alert('Erreur', 'Produit non trouvé.');
      }
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
        if (data) {
          setProduct(data);
          setIsModalVisible(true);
        } else {
          Alert.alert("Inconnu", "Produit non trouvé.");
        }
      } else {
        const results = await searchProduct(identifier);
        if (results && results.length > 0) {
          setSearchResults(results);
          setShowResultsList(true);
        } else {
          Alert.alert("Oups", "Aucun produit trouvé pour cette recherche.");
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        Alert.alert('Session expirée', 'Veuillez vous reconnecter.');
      } else {
        Alert.alert("Erreur", "Problème de connexion.");
      }
    } finally {
      setLoading(false);
    }
  };

  const selectProductFromList = (item: any) => {
    setProduct(item);
    setShowResultsList(false);
    setIsModalVisible(true);
  };

  const closeSearch = () => {
    setSearchResults([]);
    setShowResultsList(false);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const renderResultItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => selectProductFromList(item)}>
      <Image 
        source={{ uri: item.picture || 'https://via.placeholder.com/50' }} 
        style={styles.thumbnail} 
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.resultBrand}>{item.brand || 'Marque inconnue'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Scanner</Text>
        <View style={styles.searchContainer}>
            <TextInput 
                style={styles.searchInput}
                placeholder="Rechercher (riz, coca...)"
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
            />
            {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={closeSearch} style={styles.searchIcon}>
                    <Ionicons name="close-circle" size={20} color="#888" />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity onPress={handleSearch} style={styles.searchIcon}>
                    <Ionicons name="search" size={20} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
            <ActivityIndicator size="large" color="#fff" />
        ) : showResultsList ? (
            <View style={styles.listContainer}>
                <Text style={styles.resultsTitle}>{searchResults.length} résultats trouvés</Text>
                <FlatList 
                    data={searchResults}
                    keyExtractor={(item, index) => item.off_id || index.toString()}
                    renderItem={renderResultItem}
                    contentContainerStyle={{ paddingBottom: 50 }}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        ) : (
            <View style={styles.placeholderContainer}>
                <View style={styles.placeholderCard}>
                    <Ionicons name="scan-outline" size={100} color="#222" />
                    <Text style={styles.placeholderText}>Scannez un code-barres ou recherchez un produit manuellement.</Text>
                </View>
                <TouchableOpacity style={styles.scanButton} onPress={handleOpenScanner}>
                    <Ionicons name="camera" size={24} color="#000" style={{marginRight: 10}}/>
                    <Text style={styles.scanButtonText}>ACTIVER LA CAMÉRA</Text>
                </TouchableOpacity>
            </View>
        )}
      </View>

      <Modal visible={isCameraOpen} animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'black' }}>
            <CameraView 
                style={StyleSheet.absoluteFillObject} 
                facing="back" 
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} 
            />
            <View style={styles.overlay}>
                <View style={{flex:1, backgroundColor:'rgba(0,0,0,0.6)'}} />
                <View style={{height: 250, flexDirection:'row'}}>
                    <View style={{flex:1, backgroundColor:'rgba(0,0,0,0.6)'}} />
                    <View style={{width: 250, borderColor:'#fff', borderWidth:1}} />
                    <View style={{flex:1, backgroundColor:'rgba(0,0,0,0.6)'}} />
                </View>
                <View style={{flex:1, backgroundColor:'rgba(0,0,0,0.6)'}} />
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsCameraOpen(false)}>
                <Ionicons name="close" size={30} color="#000" />
            </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
                {product && (
                    <>
                        <Image 
                            source={{ uri: product.picture || 'https://via.placeholder.com/150' }} 
                            style={styles.productImage} 
                        />
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productBrand}>{product.brand}</Text>
                        
                        <View style={styles.priceTag}>
                             <Text style={styles.priceText}>
                                {product.price > 0 ? `${product.price} €` : 'Prix NC'}
                             </Text>
                        </View>

                        <TouchableOpacity 
                          style={styles.addToCartButton} 
                          onPress={() => {
                            addToCart(product);
                            setIsModalVisible(false);
                            Alert.alert("Succès", `${product.name} ajouté au panier !`);
                          }}
                        >
                          <Text style={styles.addToCartText}>Ajouter au panier</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setIsModalVisible(false)} style={{marginTop: 15}}>
                            <Text style={{color: '#666'}}>Fermer</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 60, paddingHorizontal: 20 },
  
  header: { marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 20, letterSpacing: -1 },
  searchContainer: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 15, alignItems: 'center', height: 50, borderWidth: 1, borderColor: '#333' },
  searchInput: { flex: 1, color: '#fff', fontSize: 16 },
  searchIcon: { padding: 5 },

  content: { flex: 1 },
  placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 },
  placeholderCard: { alignItems: 'center', marginBottom: 40, opacity: 0.6 },
  placeholderText: { color: '#888', textAlign: 'center', marginTop: 15, width: '70%' },
  
  scanButton: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 18, paddingHorizontal: 30, borderRadius: 30, alignItems: 'center' },
  scanButtonText: { color: '#000', fontSize: 16, fontWeight: '700' },

  listContainer: { flex: 1 },
  resultsTitle: { color: '#666', marginBottom: 10, fontSize: 12, textTransform: 'uppercase' },
  resultItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#222' },
  thumbnail: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#fff', resizeMode: 'contain' },
  resultInfo: { flex: 1, marginLeft: 15 },
  resultName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resultBrand: { color: '#888', fontSize: 14 },

  overlay: { ...StyleSheet.absoluteFillObject },
  closeButton: { position: 'absolute', bottom: 50, alignSelf:'center', backgroundColor:'#fff', width:60, height:60, borderRadius:30, justifyContent:'center', alignItems:'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: '#111', borderRadius: 20, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  productImage: { width: 120, height: 120, resizeMode: 'contain', marginBottom: 15, backgroundColor: '#fff', borderRadius: 10 },
  productName: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, color: '#fff' },
  productBrand: { fontSize: 14, color: '#888', marginBottom: 15 },
  priceTag: { backgroundColor: '#222', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, marginBottom: 20 },
  priceText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  addToCartButton: { backgroundColor: '#fff', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center' },
  addToCartText: { color: '#000', fontWeight: 'bold' },
});