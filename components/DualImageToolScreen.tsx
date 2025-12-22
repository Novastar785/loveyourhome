import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import BeforeAfterSlider from './BeforeAfterSlider';
import { reportContent } from '../src/services/reportService';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Check, Download, Flag, Home, Image as ImageIcon, Palette, Sparkles, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateDesignImage } from '../src/services/designService';
import * as StoreReview from 'expo-store-review';
import * as Haptics from 'expo-haptics';

interface DualImageProps {
  featureId: string; // 'styletransfer'
  title: string;
  subtitle: string;
  price: number;
  backgroundImage: string;
  label1: string; // "Tu Espacio"
  label2: string; // "Referencia de Estilo"
}

export default function DualImageToolScreen({ 
  featureId, title, subtitle, price, backgroundImage, label1, label2 
}: DualImageProps) {
  
  const router = useRouter();
  const { t } = useTranslation();

  const [img1, setImg1] = useState<string | null>(null);
  const [img2, setImg2] = useState<string | null>(null);
  const [activePicker, setActivePicker] = useState<1 | 2 | null>(null);
  
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    setShowPicker(false);
    if (!activePicker) return;

    const permission = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') return Alert.alert(t('common.permissions_missing'));

    const result = useCamera 
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });

    if (!result.canceled) {
      if (activePicker === 1) setImg1(result.assets[0].uri);
      else setImg2(result.assets[0].uri);
    }
    setActivePicker(null);
  };

  const openPicker = (slot: 1 | 2) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePicker(slot);
    setShowPicker(true);
  };

  const handleGenerate = async () => {
    if (!img1 || !img2) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);
    try {
      const result = await generateDesignImage({
        imageUri: img1,
        secondaryImageUri: img2, // Enviamos la segunda imagen
        featureId: featureId
      });
      setResultImage(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (error.message === 'INSUFFICIENT_CREDITS') {
        Alert.alert(t('common.insufficient_title'), t('common.insufficient_msg'), [
          { text: "OK" },
          { text: t('common.go_store'), onPress: () => router.push('/(tabs)/store') }
        ]);
      } else {
        Alert.alert(t('common.error'), t('common.error_generation'));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
  if (!resultImage) return;
  const perm = await MediaLibrary.requestPermissionsAsync();
  if (perm.status !== 'granted') return;

  try {
      const filename = FileSystem.cacheDirectory + `lyh_style_${Date.now()}.jpg`; //
      const base64 = resultImage.split('base64,')[1];
      await FileSystem.writeAsStringAsync(filename, base64, { encoding: 'base64' });
      
      const asset = await MediaLibrary.createAssetAsync(filename);

      // Lógica de Álbum
      const album = await MediaLibrary.getAlbumAsync('Love Your Home');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('Love Your Home', asset, false);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('common.saved'));

      if (await StoreReview.hasAction()) {
        StoreReview.requestReview();
      }

  } catch(e) { 
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('common.error'), t('common.error_save')); 
  } 
};

  const reset = () => {
    setResultImage(null);
    setImg1(null);
    setImg2(null);
  };

// ... lógica previa igual ...

  if (resultImage) {
    return (
      <View className="flex-1 bg-black">
        
        {/* 1. SLIDER (Usamos img1 como 'Before') */}
        {img1 ? (
           <BeforeAfterSlider 
              beforeImage={img1} 
              afterImage={resultImage} 
           />
        ) : (
           <Image source={{ uri: resultImage }} className="absolute w-full h-full" resizeMode="contain" />
        )}

        {/* 2. CONTROLES (Capa Superior) */}
        {/* CORRECCIÓN: 'absolute w-full h-full' agregado aquí también */}
        <SafeAreaView 
            className="absolute w-full h-full flex-1 justify-between px-6 pb-8" 
            pointerEvents="box-none"
        >
          {/* Parte Superior */}
          <View className="flex-row justify-between pt-4" pointerEvents="box-none">
             <TouchableOpacity 
  onPress={() => reportContent(featureId, "User flagged content", resultImage)} 
  accessibilityRole="button"
  // --- CORREGIDO: Uso de t() ---
  accessibilityLabel={t('a11y.report_content')}
  className="w-10 h-10 bg-white/20 rounded-full items-center justify-center backdrop-blur-md"
>
   <Flag size={20} color="#f87171" />
</TouchableOpacity>
             <TouchableOpacity 
                onPress={reset} 
                accessibilityRole="button"
                // --- CORREGIDO: Uso de t() ---
                accessibilityLabel={t('a11y.close_preview')}
                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center backdrop-blur-md"
             >
                <X size={20} color="white" />
             </TouchableOpacity>
          </View>

          {/* Parte Inferior */}
          <View className="w-full" pointerEvents="box-none">
            <TouchableOpacity 
                onPress={handleSave} 
                accessibilityRole="button"
                // --- CORREGIDO: Uso de t() ---
                accessibilityLabel={t('a11y.save_image')}
                className="bg-white h-14 rounded-xl justify-center items-center shadow-lg"
            >
                <Text className="font-bold text-gray-900">{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Interfaz de Selección (Light)
  return (
    <View className="flex-1 bg-white">
      {/* Fondo decorativo */}
      <Image source={{ uri: backgroundImage }} className="absolute w-full h-full opacity-10" blurRadius={60} resizeMode="cover" />
      <LinearGradient colors={['rgba(255,255,255,0.5)', '#ffffff']} className="absolute w-full h-full" />
      
      <SafeAreaView className="flex-1 px-6">
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity 
            onPress={() => router.back()} 
            accessibilityRole="button"
            // --- CORREGIDO: Uso de t() ---
            accessibilityLabel={t('a11y.go_back')}
            className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-200 shadow-sm"
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          <View className="bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
            <Text className="text-indigo-600 text-xs font-bold">{price} 💎</Text>
          </View>
        </View>

        <Text className="text-gray-900 text-3xl font-bold mb-2">{title}</Text>
        <Text className="text-gray-500 text-lg mb-8">{subtitle}</Text>

        <View className="flex-1 gap-4">
          {/* SLOT 1 (Tu Espacio) */}
          <TouchableOpacity 
            onPress={() => openPicker(1)} 
            accessibilityRole="button"
            // --- CORREGIDO: Uso de t() con parámetros ---
            accessibilityLabel={t('a11y.select_image_for', { label: label1 })}
            className={`flex-1 rounded-[24px] border-2 border-dashed items-center justify-center relative overflow-hidden transition-all ${img1 ? 'border-indigo-500 bg-white' : 'border-gray-300 bg-gray-50'}`}
          >
            {img1 ? (
                // CAMBIO: resizeMode="contain" para que la imagen quepa entera sin deformarse
                <Image source={{ uri: img1 }} className="w-full h-full opacity-90" resizeMode="contain" />
            ) : (
                <View className="items-center gap-2">
                    <View className="w-14 h-14 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100">
                        <Home size={28} color="#9ca3af" />
                    </View>
                    <Text className="text-gray-400 font-bold">{label1}</Text>
                </View>
            )}
            {/* Check de confirmación */}
            {img1 && (
                <View className="absolute top-3 right-3 bg-indigo-500 p-1.5 rounded-full shadow-sm border border-white">
                    <Check size={14} color="white" />
                </View>
            )}
          </TouchableOpacity>

          {/* SLOT 2 (Referencia) */}
          <TouchableOpacity 
            onPress={() => openPicker(2)} 
            accessibilityRole="button"
            // --- CORREGIDO: Uso de t() con parámetros ---
            accessibilityLabel={t('a11y.select_image_for', { label: label2 })}
            className={`flex-1 rounded-[24px] border-2 border-dashed items-center justify-center relative overflow-hidden transition-all ${img2 ? 'border-purple-500 bg-white' : 'border-gray-300 bg-gray-50'}`}
          >
            {img2 ? (
                // CAMBIO: resizeMode="contain" aquí también
                <Image source={{ uri: img2 }} className="w-full h-full opacity-90" resizeMode="contain" />
            ) : (
                <View className="items-center gap-2">
                    <View className="w-14 h-14 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100">
                        <Palette size={28} color="#9ca3af" />
                    </View>
                    <Text className="text-gray-400 font-bold">{label2}</Text>
                </View>
            )}
            
            {img2 && (
                <View className="absolute top-3 right-3 bg-purple-500 p-1.5 rounded-full shadow-sm border border-white">
                    <Check size={14} color="white" />
                </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          disabled={!img1 || !img2 || isProcessing}
          onPress={handleGenerate}
          accessibilityRole="button"
          // --- CORREGIDO: Uso de t() ---
          accessibilityLabel={t('a11y.generate_design')}
          accessibilityState={{ disabled: !img1 || !img2 || isProcessing }}
          className={`my-8 h-16 rounded-2xl flex-row items-center justify-center shadow-lg transition-all ${img1 && img2 ? 'bg-indigo-600 shadow-indigo-300' : 'bg-gray-200 shadow-none'}`}
        >
          {isProcessing ? (
            <ActivityIndicator color={img1 && img2 ? "white" : "#9ca3af"} />
          ) : (
            <>
                <View className="mr-2">
  <Sparkles size={24} color={img1 && img2 ? "white" : "#9ca3af"} />
</View>
                <Text className={`font-bold text-lg ${img1 && img2 ? 'text-white' : 'text-gray-400'}`}>
                    {t('styletransfer_tool.btn_ready')}
                </Text>
            </>
          )}
        </TouchableOpacity>
      </SafeAreaView>

      <Modal visible={showPicker} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/20">
          <View className="bg-white p-6 rounded-t-[32px] gap-4 shadow-2xl">
            <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-2" />
            <Text className="text-gray-900 font-bold text-center text-xl mb-4">{t('common.select_image')}</Text>
            
            <TouchableOpacity onPress={() => pickImage(true)} className="bg-gray-50 p-4 rounded-2xl flex-row gap-4 items-center border border-gray-100">
                <View className="bg-white p-2 rounded-full shadow-sm"><Camera color="#4f46e5" size={24} /></View>
                <Text className="text-gray-700 font-bold text-lg">{t('common.camera')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => pickImage(false)} className="bg-gray-50 p-4 rounded-2xl flex-row gap-4 items-center border border-gray-100">
                <View className="bg-white p-2 rounded-full shadow-sm"><ImageIcon color="#4f46e5" size={24} /></View>
                <Text className="text-gray-700 font-bold text-lg">{t('common.gallery')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowPicker(false)} className="p-4 items-center mt-2">
                <Text className="text-gray-400 font-bold text-base">{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );  
}