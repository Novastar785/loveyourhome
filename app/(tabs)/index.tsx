import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, Sparkles, X } from 'lucide-react-native';
import { cssInterop } from "nativewind";
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Image, Modal, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRemoteConfig } from '../../hooks/useRemoteConfig'; // <--- AGREGAR ESTO
import { getUserCredits } from '../../src/services/revenueCat';

cssInterop(LinearGradient, {
  className: "style",
});

const { width } = Dimensions.get('window');

const PLACEHOLDER_GALLERY = [
  { id: 'p1', uri: 'https://rizzflows.com/img_aura/gallery/placeholder1.png' },
  { id: 'p2', uri: 'https://rizzflows.com/img_aura/gallery/placeholder2.jpg' },
  { id: 'p3', uri: 'https://rizzflows.com/img_aura/gallery/placeholder3.jpg' },
  { id: 'p4', uri: 'https://rizzflows.com/img_aura/gallery/placeholder4.jpg' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation(); // ✨ Hook
  
  const { getCost } = useRemoteConfig();
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [credits, setCredits] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null); // <--- NUEVO

  // Cargar créditos cada vez que la pantalla se enfoca

  // Cargar créditos cada vez que la pantalla se enfoca
  useFocusEffect(
    useCallback(() => {
      const loadCredits = async () => {
        const creditData = await getUserCredits();
        setCredits(creditData.total);
      };
      loadCredits();
    }, [])
  );

  // --- CONFIGURACIÓN DE RUTAS DINÁMICA (PARA TRADUCCIONES) ---
  const TOOLS = [
    { 
      id: 'interiordesign', 
      route: '/features/interiordesign', 
      title: t('tools.interiordesign.title'), 
      subtitle: t('tools.interiordesign.subtitle'), 
      price: getCost('interiordesign', 3), 
      // Imagen placeholder temporal
      image: 'https://rizzflows.com/img_aura/gallery/placeholder1.png', 
      badge: 'NEW' 
    },
    { 
      id: 'exteriordesign', 
      route: '/features/exteriordesign', 
      title: t('tools.exteriordesign.title'), 
      subtitle: t('tools.exteriordesign.subtitle'), 
      price: getCost('exteriordesign', 3), 
      // Imagen placeholder para exterior
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80', 
      badge: 'PRO' 
    },
    { 
      id: 'gardendesign', 
      route: '/features/gardendesign', 
      title: t('tools.gardendesign.title'), 
      subtitle: t('tools.gardendesign.subtitle'), 
      price: getCost('gardendesign', 3), 
      image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600', 
      badge: 'PRO' 
    },
    { 
     id: 'styletransfer', 
     route: '/features/styletransfer', 
     title: t('tools.styletransfer.title'), 
     subtitle: t('tools.styletransfer.subtitle'), 
     price: getCost('styletransfer', 3), // <--- CAMBIO: Precio dinámico (default 3) 
     image: 'https://rizzflows.com/img_aura/Vtryon.png', 
     badge: 'FUN' 
   },
   { 
     id: 'interiordesign', 
     route: '/features/interiordesign', 
     title: t('tools.stylist.title'), 
     subtitle: t('tools.stylist.subtitle'), 
     price: getCost('stylist', 2), // <--- CAMBIO: Precio dinámico (default 2)
     image: 'https://rizzflows.com/img_aura/Image_fx(3).png', 
     badge: 'TRENDING' 
   },
   { 
     id: 'hairstudio', 
     route: '/features/hairstudio', 
     title: t('tools.hairstudio.title'), 
     subtitle: t('tools.hairstudio.subtitle'), 
     price: getCost('hairstudio', 2), // <--- CAMBIO 
     image: 'https://rizzflows.com/img_aura/Image_fx(13).png', 
     badge: 'NEW' 
   },
    { 
     id: 'fitness', 
     route: '/features/fitness', 
     title: t('tools.fitness.title'), 
     subtitle: t('tools.fitness.subtitle'), 
     price: getCost('fitness', 3), // <--- CAMBIO
     image: 'https://rizzflows.com/img_aura/Image_fx(14).png', 
     badge: '' 
   },
     { 
     id: 'glowup', 
     route: '/features/glowup', 
     title: t('tools.glowup.title'), 
     subtitle: t('tools.glowup.subtitle'), 
     price: getCost('glowup', 2), // <--- CAMBIO
     image: 'https://rizzflows.com/img_aura/Image_fx(8).png', 
     badge: '' 
   },
   { 
     id: 'luxury', 
     route: '/features/luxury', 
     title: t('tools.luxury.title'), 
     subtitle: t('tools.luxury.subtitle'), 
     price: getCost('luxury', 2), // <--- CAMBIO
     image: 'https://rizzflows.com/img_aura/bmw%20rojo.jpg', 
     badge: 'VIRAL' 
   },
   { 
     id: 'socials', 
     route: '/features/socials', 
     title: t('tools.socials.title'), 
     subtitle: t('tools.socials.subtitle'), 
     price: getCost('socials', 2), // <--- CAMBIO
     image: 'https://rizzflows.com/img_aura/Image_fx(10).png', 
     badge: '' 
   },
     { 
     id: 'globetrotter', 
     route: '/features/globetrotter', 
     title: t('tools.globetrotter.title'), 
     subtitle: t('tools.globetrotter.subtitle'), 
     price: getCost('globetrotter', 2), // <--- CAMBIO 
     image: 'https://rizzflows.com/img_aura/Image_fx(12).png', 
     badge: 'NEW' 
   }, 
   { 
     id: 'headshot', 
     route: '/features/headshot', 
     title: t('tools.headshot.title'), 
     subtitle: t('tools.headshot.subtitle'), 
     price: getCost('headshot', 3), // <--- CAMBIO
     image: 'https://rizzflows.com/img_aura/Image_fx(1).png', 
     badge: 'POPULAR' 
   },
 ];

  useEffect(() => {
    (async () => {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        
        if (status === 'granted') {
          setHasPermission(true);
          loadAuraAlbum();
        } else {
          console.log("Permisos denegados o limitados.");
        }
      } catch (e) {
        console.log("Modo Expo Go: Usando galería de ejemplo.");
      }
    })();
  }, []);

  const loadAuraAlbum = async () => {
    try {
      const album = await MediaLibrary.getAlbumAsync('Aura AI');
      if (album) {
        const assets = await MediaLibrary.getAssetsAsync({
          album: album,
          first: 20,
          mediaType: 'photo',
          sortBy: ['creationTime'],
        });
        setGalleryPhotos(assets.assets);
      } else {
        setGalleryPhotos([]);
      }
    } catch (e) {
      console.log("No se pudo cargar el álbum, usando ejemplos.");
    }
  };

  const displayPhotos = galleryPhotos.length > 0 ? galleryPhotos : PLACEHOLDER_GALLERY;
  const isShowingPlaceholders = galleryPhotos.length === 0;

  return (
    <View className="flex-1 bg-[#0f0f0f]">
      <StatusBar barStyle="light-content" />
      
      <View style={{ paddingTop: insets.top }} className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          
          {/* HEADER */}
          <View className="flex-row justify-between items-center px-6 pt-2 mb-8">
            <View>
              <Text className="text-zinc-500 text-xs font-medium tracking-widest uppercase mb-1">AURA AI</Text>
              <Text className="text-white text-3xl font-bold">{t('home.subtitle')}</Text>
            </View>
            <TouchableOpacity className="flex-row items-center bg-zinc-800/80 px-3 py-1.5 rounded-full border border-zinc-700">
              <View className="w-2 h-2 rounded-full bg-purple-500 mr-2 shadow-lg shadow-purple-500" />
              <Text className="text-white font-bold mr-2">{credits}</Text>
              <Plus size={14} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* CARRUSEL DE HERRAMIENTAS IA */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center px-6 mb-4">
              <View className="flex-row items-center gap-2">
                <Sparkles size={16} color="#fbbf24" />
                <Text className="text-white font-bold text-lg">{t('home.tools_header')}</Text>
              </View>
              <Text className="text-zinc-500 text-xs">{t('home.swipe')}</Text>
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
                  className="relative overflow-hidden rounded-[32px] bg-zinc-800"
                  style={{ width: width * 0.75, height: 380 }}
                  onPress={() => router.push(item.route as any)}
                >
                  <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
                  
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.95)']}
                    className="absolute bottom-0 w-full h-full justify-end p-6"
                  >
                    {item.badge && (
                      <View className="absolute top-6 left-6 bg-rose-500 px-3 py-1 rounded-full shadow-lg border border-white/10">
                        <Text className="text-white text-[10px] font-bold tracking-wider">{item.badge}</Text>
                      </View>
                    )}
                    
                    <Text className="text-white text-3xl font-bold leading-tight shadow-sm mb-1">{item.title}</Text>
                    <Text className="text-zinc-300 text-sm mb-5 font-medium">{item.subtitle}</Text>
                    
                    <View className="bg-white/10 backdrop-blur-md self-start px-5 py-3 rounded-2xl flex-row items-center border border-white/20">
                      <Text className="text-white font-bold mr-2">{t('tools.start_btn')}</Text>
                      <View className="bg-black/40 px-2 py-0.5 rounded-md">
                         <Text className="text-zinc-200 text-xs font-bold">{item.price} 💎</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* GALERÍA INTELIGENTE + PLACEHOLDERS */}
          <View className="px-6">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <Text className="text-zinc-200 font-bold text-lg">{t('home.gallery_header')}</Text>
                {!isShowingPlaceholders && (
                  <View className="bg-zinc-800 px-2 py-0.5 rounded-md">
                    <Text className="text-zinc-400 text-xs">{galleryPhotos.length}</Text>
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
                  className="bg-zinc-900 rounded-3xl mb-4 overflow-hidden border border-zinc-800 relative"
                  style={{ width: (width - 48) / 2 - 6, height: 220 }}
                >
                  <Image source={{ uri: photo.uri }} className="w-full h-full opacity-80" resizeMode="cover" />
                  
                  {isShowingPlaceholders && (
                     <View className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                        <Text className="text-white text-[10px] font-medium tracking-wide">{t('home.example_tag')}</Text>
                     </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {isShowingPlaceholders && (
               <Text className="text-zinc-600 text-xs text-center mt-2 italic">
                  {t('home.empty_gallery')}
               </Text>
            )}
          </View>
        </ScrollView>       
      </View>

      {/* MODAL PARA VER FOTO EN GRANDE */}
      <Modal 
        visible={!!selectedPhoto} 
        transparent={true} 
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View className="flex-1 bg-black justify-center items-center relative">
            <Image 
              source={{ uri: selectedPhoto || "" }} 
              style={{ width: width, height: '100%' }} 
              resizeMode="contain" 
            />
            <TouchableOpacity 
              onPress={() => setSelectedPhoto(null)} 
              className="absolute top-12 right-6 w-10 h-10 bg-black/50 rounded-full items-center justify-center border border-white/20"
            >
              <X color="white" size={24} />
            </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
}