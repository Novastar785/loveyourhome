import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { reportContent } from '../src/services/reportService';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Flag, Image as ImageIcon, Sparkles, X, Check } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, Text, TouchableOpacity, View, ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateDesignImage } from '../src/services/designService';
import BeforeAfterSlider from './BeforeAfterSlider';
import * as StoreReview from 'expo-store-review';
import * as Haptics from 'expo-haptics';

export interface DesignOption {
  id: string; 
  label: string;
  image: ImageSourcePropType;
}

interface SingleStepProps {
  featureId: string;
  title: string;
  subtitle: string;
  price: number;
  backgroundImage: ImageSourcePropType;
  options: DesignOption[];
  selectionTitle?: string;
}

export default function SingleStepDesignScreen({ 
  featureId, title, subtitle, price, backgroundImage, options, selectionTitle 
}: SingleStepProps) {
  
  const router = useRouter();
  const { t } = useTranslation();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(options[0]?.id || null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (options.length > 0 && !selectedOption) setSelectedOption(options[0].id);
  }, [options]);

  const pickImage = async (useCamera: boolean) => {
    setShowPicker(false);
    const permission = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') return Alert.alert(t('common.permissions_missing'));

    const result = useCamera 
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });

    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  const handleGenerate = async () => {
    if (!selectedImage || !selectedOption) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);
    try {
      const result = await generateDesignImage({
        imageUri: selectedImage,
        featureId: featureId,
        option1Id: selectedOption
      });
      setResultImage(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (error.message === 'INSUFFICIENT_CREDITS') {
        Alert.alert(t('common.insufficient_title'), t('common.insufficient_msg'), [
          { text: t('common.ok') }, 
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
        const filename = FileSystem.cacheDirectory + `lyh_design_${Date.now()}.jpg`;
        const base64 = resultImage.split('base64,')[1];
        await FileSystem.writeAsStringAsync(filename, base64, { encoding: 'base64' });
        
        const asset = await MediaLibrary.createAssetAsync(filename);
        
        // Mantenemos la lógica consistente de guardar en álbum si existe
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
    setSelectedImage(null);
  };

  // PANTALLA DE RESULTADO
  if (resultImage) {
    return (
      <View className="flex-1 bg-black">
        {selectedImage ? (
           <BeforeAfterSlider 
              beforeImage={selectedImage} 
              afterImage={resultImage} 
           />
        ) : (
           <Image source={{ uri: resultImage }} className="absolute w-full h-full" resizeMode="contain" />
        )}

        <SafeAreaView 
            className="absolute w-full h-full flex-1 justify-between px-6 pb-8" 
            pointerEvents="box-none"
        >
          <View className="flex-row justify-between pt-4" pointerEvents="box-none">
             <TouchableOpacity 
                onPress={() => reportContent(featureId, "User flagged content", resultImage)} 
                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center backdrop-blur-md"
                accessibilityRole="button"
                accessibilityLabel={t('a11y.report_content')}
             >
                <Flag size={20} color="#f87171" />
             </TouchableOpacity>
             <TouchableOpacity 
                onPress={reset} 
                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center backdrop-blur-md"
                accessibilityRole="button"
                accessibilityLabel={t('a11y.close_preview')}
             >
                <X size={20} color="white" />
             </TouchableOpacity>
          </View>
          
          <View className="w-full" pointerEvents="box-none">
             <TouchableOpacity 
                onPress={handleSave} 
                accessibilityRole="button"
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

  // PANTALLA DE SELECCIÓN
  return (
    <View className="flex-1 bg-white">
      <Image 
        source={backgroundImage} 
        className="absolute w-full h-full opacity-10" 
        blurRadius={60} 
        resizeMode="cover" 
      />
      <LinearGradient 
        colors={['rgba(255,255,255,0.5)', '#ffffff']} 
        className="absolute w-full h-full" 
      />
      
      <SafeAreaView className="flex-1 px-6">
        {/* Header con Botón Atrás y Badge de Precio */}
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-200 shadow-sm"
            accessibilityRole="button"
            accessibilityLabel={t('a11y.go_back')}
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          
          <View className="bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
            <Text className="text-indigo-600 text-xs font-bold">{price} 💎</Text>
          </View>
        </View>

        <Text className="text-gray-900 text-3xl font-bold mb-2">{title}</Text>
        <Text className="text-gray-500 text-base mb-6">{subtitle}</Text>

        {/* Contenido Principal */}
        <View className="flex-1">
            
            {/* Slot de Imagen - Altura fija para formato apaisado */}
            <TouchableOpacity 
                onPress={() => setShowPicker(true)} 
                className={`w-full h-80 rounded-[24px] border-2 border-dashed items-center justify-center relative overflow-hidden transition-all mb-6 ${selectedImage ? 'border-indigo-500 bg-white' : 'border-gray-300 bg-gray-50'}`}
                accessibilityRole="button"
                accessibilityLabel={selectedImage ? t('common.change_photo') : t('common.upload_photo')}
                accessibilityHint={t('a11y.upload_photo_hint', { cost: price })}
            >
                {selectedImage ? (
                    <>
                        {/* Imagen subida por el usuario ajustada con contain */}
                        <Image source={{ uri: selectedImage }} className="w-full h-full" resizeMode="contain" />
                        
                        <View className="absolute bottom-4 right-4 bg-indigo-600 p-2.5 rounded-full shadow-lg border border-white">
                            <Camera size={20} color="white" />
                        </View>
                        
                        <View className="absolute top-4 right-4 bg-green-500 p-1.5 rounded-full shadow-sm border border-white">
                            <Check size={14} color="white" />
                        </View>
                    </>
                ) : (
                    /* ESTADO VACÍO: Solo Icono y Texto (Sin precio) */
                    <View className="items-center gap-3 px-8">
                        <View className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100">
                             <Camera size={32} color="#9ca3af" />
                        </View>
                        {/* Usando traducción exacta */}
                        <Text className="text-gray-400 font-bold text-center text-lg">{t('common.upload_photo')}</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Opciones y Botón - Solo visibles si hay imagen */}
            {selectedImage ? (
                <View className="pb-2 flex-1 justify-end">
                     <Text className="text-gray-500 text-xs font-bold mb-3 ml-1 uppercase tracking-wider">{selectionTitle || t('generic_tool.choose_style')}</Text>
                     
                     <View className="h-36 mb-4">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
                            {options.map((opt) => (
                            <TouchableOpacity 
                                key={opt.id} 
                                onPress={() => setSelectedOption(opt.id)} 
                                activeOpacity={0.8} 
                                className="relative"
                            >
                                <View className={`w-24 h-32 rounded-xl overflow-hidden border-2 transition-all ${selectedOption === opt.id ? 'border-indigo-600' : 'border-gray-200'}`}>
                                    <Image source={opt.image} className="w-full h-full" resizeMode="cover" />
                                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} className="absolute bottom-0 w-full h-16" />
                                    
                                    {/* Texto dentro de la card para evitar cortes */}
                                    <Text className="absolute bottom-2 w-full text-center text-xs font-bold text-white shadow-sm px-1" numberOfLines={1}>
                                        {opt.label}
                                    </Text>
                                </View>
                                
                                {selectedOption === opt.id && (
                                    <View className="absolute top-2 right-2 bg-indigo-600 p-1 rounded-full shadow-sm z-10">
                                        <Sparkles size={10} color="white" />
                                    </View>
                                )}
                            </TouchableOpacity>
                            ))}
                        </ScrollView>
                     </View>

                    <TouchableOpacity 
                        disabled={isProcessing} 
                        onPress={handleGenerate} 
                        className={`h-14 rounded-xl flex-row items-center justify-center shadow-lg ${isProcessing ? 'bg-gray-400' : 'bg-indigo-600'}`}
                    >
                        {isProcessing ? <ActivityIndicator color="white" /> : (
                            <>
                                <Sparkles size={20} color="white" className="mr-2" />
                                <Text className="text-white font-bold text-lg">{t('generic_tool.generate_btn')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            ) : (
                <View className="flex-1" />
            )}
        </View>
      </SafeAreaView>

      <Modal visible={showPicker} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/20">
          <View className="bg-white p-6 rounded-t-[32px] gap-4 shadow-2xl">
            <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-2" />
            <Text className="text-gray-900 font-bold text-center text-xl mb-4">{t('common.select_image')}</Text>
            
            <TouchableOpacity 
                onPress={() => pickImage(true)} 
                className="bg-gray-50 p-4 rounded-2xl flex-row gap-4 items-center border border-gray-100"
            >
                <View className="bg-white p-2 rounded-full shadow-sm"><Camera color="#4f46e5" size={24} /></View>
                <Text className="text-gray-700 font-bold text-lg">{t('common.camera')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                onPress={() => pickImage(false)} 
                className="bg-gray-50 p-4 rounded-2xl flex-row gap-4 items-center border border-gray-100"
            >
                <View className="bg-white p-2 rounded-full shadow-sm"><ImageIcon color="#4f46e5" size={24} /></View>
                <Text className="text-gray-700 font-bold text-lg">{t('common.gallery')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                onPress={() => setShowPicker(false)} 
                className="p-4 items-center mt-2"
            >
                <Text className="text-gray-400 font-bold text-base">{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}