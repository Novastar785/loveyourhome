import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, Sparkles, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Image, Modal, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- IMPORTACIONES DE TU LÓGICA ---
import { useRemoteConfig } from '../../hooks/useRemoteConfig';
import { getUserCredits } from '../../src/services/revenueCat';

const { width } = Dimensions.get('window');

// Mantenemos tus constantes
const PLACEHOLDER_GALLERY = [
  { id: 'p1', uri: 'https://rizzflows.com/img_aura/gallery/placeholder1.png' },
  { id: 'p2', uri: 'https://rizzflows.com/img_aura/gallery/placeholder2.jpg' },
  { id: 'p3', uri: 'https://rizzflows.com/img_aura/gallery/placeholder3.jpg' },
  { id: 'p4', uri: 'https://rizzflows.com/img_aura/gallery/placeholder4.jpg' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  
  // --- LÓGICA DE NEGOCIO ORIGINAL (INTACTA) ---
  const { getCost } = useRemoteConfig();
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [credits, setCredits] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadCredits = async () => {
        const creditData = await getUserCredits();
        setCredits(creditData.total);
      };
      loadCredits();
    }, [])
  );

  const TOOLS = [
    { 
      id: 'interiordesign', 
      route: '/features/interiordesign', 
      title: t('tools.interiordesign.title'), 
      subtitle: t('tools.interiordesign.subtitle'), 
      price: getCost('interiordesign', 3), 
      image: 'http://rizzflows.com/img_lyh/interior.png', 
      badge: 'NEW' 
    },
    { 
      id: 'exteriordesign', 
      route: '/features/exteriordesign', 
      title: t('tools.exteriordesign.title'), 
      subtitle: t('tools.exteriordesign.subtitle'), 
      price: getCost('exteriordesign', 3), 
      image: 'http://rizzflows.com/img_lyh/exterior.jpg', 
      badge: 'PRO' 
    },
    { 
      id: 'gardendesign', 
      route: '/features/gardendesign', 
      title: t('tools.gardendesign.title'), 
      subtitle: t('tools.gardendesign.subtitle'), 
      price: getCost('gardendesign', 3), 
      image: 'http://rizzflows.com/img_lyh/jardin.png', 
      badge: 'PRO' 
    },
    { 
     id: 'styletransfer', 
     route: '/features/styletransfer', 
     title: t('tools.styletransfer.title'), 
     subtitle: t('tools.styletransfer.subtitle'), 
     price: getCost('styletransfer', 3), 
     image: 'http://rizzflows.com/img_lyh/transfer.png', 
     badge: 'FUN' 
   },
 ];

  useEffect(() => {
    (async () => {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          setHasPermission(true);
          loadAuraAlbum();
        }
      } catch (e) { console.log("Error permisos o Expo Go"); }
    })();
  }, []);

  const loadAuraAlbum = async () => {
    try {
      const album = await MediaLibrary.getAlbumAsync('Love Your Home'); 
      if (album) {
        const assets = await MediaLibrary.getAssetsAsync({ album, first: 20, mediaType: 'photo', sortBy: ['creationTime'] });
        setGalleryPhotos(assets.assets);
      } else { setGalleryPhotos([]); }
    } catch (e) { setGalleryPhotos([]); }
  };

  const displayPhotos = galleryPhotos.length > 0 ? galleryPhotos : PLACEHOLDER_GALLERY;
  const isShowingPlaceholders = galleryPhotos.length === 0;

  // --- RENDERIZADO VISUAL ACTUALIZADO (GLASSY LIGHT) ---
  return (
    <View className="flex-1 bg-white">
      {/* Fondo Gradiente usando Tailwind absolute inset-0 */}
      <LinearGradient
        colors={['#EEF2FF', '#ffffff', '#F5F3FF']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      
      <StatusBar barStyle="dark-content" />
      
      {/* Container principal respetando Insets */}
      <View style={{ paddingTop: insets.top }} className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          
          {/* HEADER */}
          <View className="flex-row justify-between items-end px-6 pt-2 mb-8">
            <View>
              <Text className="text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-1">LOVE YOUR HOME</Text>
              <Text className="text-gray-900 text-3xl font-extrabold leading-tight">Your Dream Home</Text>
            </View>
            
            {/* Pill de Créditos ACTUALIZADO */}
            <TouchableOpacity className="flex-row items-center bg-[#F5F2EF] px-3 py-1.5 rounded-full border border-[#E5E0D8] shadow-sm">
              <View className="w-2 h-2 rounded-full bg-[#A58D76] mr-2" />
              <Text className="text-gray-800 font-bold mr-2 text-xs">{credits}</Text>
              <Plus size={12} color="#A58D76" />
            </TouchableOpacity>
          </View>

          {/* CARRUSEL */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center px-6 mb-4">
              <View className="flex-row items-center gap-2">
                <Sparkles size={16} color="#F59E0B" fill="#F59E0B" />
                <Text className="text-gray-900 font-bold text-sm tracking-wide">{t('home.tools_header')}</Text>
              </View>
              <Text className="text-gray-400 text-xs">{t('home.swipe')}</Text>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
            >
              {TOOLS.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  activeOpacity={0.9}
                  className="relative overflow-hidden rounded-[32px] bg-white border border-white"
                  // Usamos style aquí para sombra específica de color que NativeWind a veces no mapea bien en Android/iOS mixtos
                  style={{ width: width * 0.75, height: 400, shadowColor: '#4f46e5', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}
                  onPress={() => router.push(item.route as any)}
                >
                  <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />

                  {/* BADGE: Posicionado arriba a la derecha */}
                  {item.badge && (
                    <View className="absolute top-5 right-5 bg-white/90 px-2 py-1 rounded-lg border border-white shadow-sm z-10">
                      <Text className="text-indigo-600 text-[10px] font-bold tracking-wider">{item.badge}</Text>
                    </View>
                  )}
                  
                  {/* Overlay Gradiente */}
                  <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,1)']}
                    className="absolute bottom-0 w-full h-1/2 justify-end p-6"
                  >
                    
                    <Text className="text-gray-900 text-3xl font-bold leading-tight mb-1">{item.title}</Text>
                    <Text className="text-gray-500 text-sm mb-5 font-medium">{item.subtitle}</Text>
                    
                    {/* BOTÓN ACTUALIZADO: Estilo Marrón con Flecha */}
                    <View className="bg-[#A58D76] self-start px-6 py-4 rounded-2xl flex-row items-center justify-between w-full shadow-lg">
                      <View className="flex-row items-center">
                        <Text className="text-white font-serif text-lg font-medium mr-2">Start Design</Text>
                        </View>
                      
                      <View className="flex-row items-center opacity-80">
                        <View className="w-[1px] h-3 bg-white/40 mx-2" />
                        <Text className="text-white text-xs font-bold">{item.price} 💎</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* GALERÍA */}
          <View className="px-6">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <Text className="text-gray-900 font-bold text-lg">{t('home.gallery_header')}</Text>
                {!isShowingPlaceholders && (
                  <View className="bg-gray-100 px-2 py-0.5 rounded-md">
                    <Text className="text-gray-500 text-xs font-bold">{galleryPhotos.length}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View className="flex-row flex-wrap justify-between">
              {displayPhotos.map((photo) => (
                <TouchableOpacity 
                  key={photo.id} 
                  activeOpacity={0.8}
                  onPress={() => setSelectedPhoto(photo.uri)}
                  className="bg-white rounded-3xl mb-4 overflow-hidden border border-gray-100 shadow-sm relative"
                  style={{ width: (width - 48) / 2 - 6, height: 240 }}
                >
                  <Image source={{ uri: photo.uri }} className="w-full h-full" resizeMode="cover" />
                  
                  {isShowingPlaceholders && (
                     <View className="absolute top-2 right-2 bg-white/80 px-2 py-1 rounded-md">
                        <Text className="text-gray-500 text-[8px] font-bold tracking-wide">{t('home.example_tag')}</Text>
                     </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {isShowingPlaceholders && (
               <Text className="text-gray-400 text-xs text-center mt-4">
                  {t('home.empty_gallery')}
               </Text>
            )}
          </View>
        </ScrollView>       
      </View>

      {/* MODAL (Tailwind aplicado) */}
      <Modal 
        visible={!!selectedPhoto} 
        transparent={true} 
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View className="flex-1 bg-white/95 justify-center items-center relative">
            <Image 
              source={{ uri: selectedPhoto || "" }} 
              style={{ width: width, height: '80%', borderRadius: 20 }} 
              resizeMode="contain" 
            />
            <TouchableOpacity 
              onPress={() => setSelectedPhoto(null)} 
              className="absolute top-12 right-6 w-10 h-10 bg-gray-100 rounded-full items-center justify-center border border-gray-200 shadow-sm"
            >
              <X color="#374151" size={20} />
            </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
}