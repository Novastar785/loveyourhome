// components/WizardToolScreen.tsx
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Camera, Check, Flag, Image as ImageIcon, Sparkles, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateDesignImage } from '../src/services/designService';

export interface WizardOption {
  id: string; // Este ID debe existir en la DB (ej: 'room_kitchen')
  label: string;
  image: string;
}

interface WizardProps {
  featureId: string; // 'interiordesign'
  title: string;
  subtitle: string;
  backgroundImage: string;
  step1Title: string;
  step1Options: WizardOption[];
  step2Title: string;
  step2Options: WizardOption[];
}

export default function WizardToolScreen({ 
  featureId, title, subtitle, backgroundImage, 
  step1Title, step1Options, step2Title, step2Options 
}: WizardProps) {
  
  const router = useRouter();
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [opt1, setOpt1] = useState<WizardOption | null>(null);
  const [opt2, setOpt2] = useState<WizardOption | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

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
    if (!selectedImage || !opt1 || !opt2) return;
    
    setIsProcessing(true);
    try {
      const result = await generateDesignImage({
        imageUri: selectedImage,
        featureId: featureId,
        option1Id: opt1.id,
        option2Id: opt2.id
      });
      setResultImage(result);
      setStep(4);
    } catch (error: any) {
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
  
  // 1. Pedir permisos
  const perm = await MediaLibrary.requestPermissionsAsync();
  if (perm.status !== 'granted') {
    Alert.alert(t('common.permission_denied'));
    return;
  }

  try {
      // 2. Crear asset con prefijo nuevo 'lyh_' (Love Your Home)
      const filename = FileSystem.cacheDirectory + `lyh_design_${Date.now()}.jpg`; //
      const base64 = resultImage.split('base64,')[1];
      await FileSystem.writeAsStringAsync(filename, base64, { encoding: 'base64' });
      
      const asset = await MediaLibrary.createAssetAsync(filename);

      // 3. Guardar en álbum "Love Your Home"
      const album = await MediaLibrary.getAlbumAsync('Love Your Home');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('Love Your Home', asset, false);
      }

      Alert.alert(t('common.saved'));
  } catch(e) { 
      console.error(e);
      Alert.alert(t('common.error'), "No se pudo guardar en el álbum."); 
  }
};

  const reset = () => {
    setStep(1);
    setSelectedImage(null);
    setOpt1(null);
    setOpt2(null);
    setResultImage(null);
  };

  if (step === 4 && resultImage) {
    return (
      <View className="flex-1 bg-black">
        {/* Aquí mantenemos fondo negro para resaltar la imagen generada, pero los controles flotantes cambian */}
        <Image source={{ uri: resultImage }} className="absolute w-full h-full" resizeMode="contain" />
        <SafeAreaView className="flex-1 justify-between px-6 pb-8">
          <View className="flex-row justify-between pt-4">
             <TouchableOpacity onPress={() => Alert.alert("Reported")} className="w-10 h-10 bg-white/20 rounded-full items-center justify-center backdrop-blur-md"><Flag size={20} color="#f87171" /></TouchableOpacity>
             <TouchableOpacity onPress={reset} className="w-10 h-10 bg-white/20 rounded-full items-center justify-center backdrop-blur-md"><X size={20} color="white" /></TouchableOpacity>
          </View>
          <View className="flex-row gap-4">
             <TouchableOpacity onPress={handleSave} className="flex-1 bg-white h-12 rounded-xl justify-center items-center shadow-lg"><Text className="font-bold text-gray-900">{t('common.save')}</Text></TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // WIZARD UI (Pasos 1, 2, 3)
  return (
    <View className="flex-1 bg-white">
      {/* Fondo de imagen muy sutil o desvanecido a blanco */}
      <Image source={{ uri: backgroundImage }} className="absolute w-full h-2/3 opacity-10" blurRadius={40} />
      <LinearGradient colors={['rgba(255,255,255,0)', '#ffffff']} className="absolute w-full h-full" />
      
      <SafeAreaView className="flex-1 px-6">
        {/* Header de Navegación */}
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-200 shadow-sm">
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          
          {/* Indicador de Pasos */}
          <View className="flex-row gap-1">
            {[1, 2, 3].map(i => <View key={i} className={`h-1.5 rounded-full ${i <= step ? 'bg-indigo-500 w-6' : 'bg-gray-200 w-3'}`} />)}
          </View>
          <View className="w-10" />
        </View>

        <View className="flex-1">
          {/* PASO 1: Intro / Subir Foto */}
          {step === 1 && (
            <View className="flex-1 justify-center">
              <Text className="text-gray-900 text-3xl font-bold text-center mb-2">{title}</Text>
              <Text className="text-gray-500 text-center mb-8">{subtitle}</Text>
              
              <TouchableOpacity onPress={() => setShowPicker(true)} className="aspect-[3/4] bg-gray-50 rounded-3xl border-2 border-dashed border-gray-300 items-center justify-center overflow-hidden relative shadow-sm">
                {selectedImage ? 
                  <Image source={{ uri: selectedImage }} className="w-full h-full" /> : 
                  <View className="items-center gap-3">
                    <View className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-sm">
                        <Camera size={32} color="#6366f1" />
                    </View>
                    <Text className="text-gray-500 font-medium">{t('common.upload_photo')}</Text>
                  </View>
                }
              </TouchableOpacity>

              <TouchableOpacity disabled={!selectedImage} onPress={() => setStep(2)} className={`mt-8 h-14 rounded-2xl justify-center items-center shadow-lg ${selectedImage ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                <Text className={`font-bold text-lg ${selectedImage ? 'text-white' : 'text-gray-400'}`}>Siguiente</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PASO 2: Selección Opción 1 */}
          {step === 2 && (
            <View className="flex-1">
              <Text className="text-gray-900 text-2xl font-bold mb-6 text-center">{step1Title}</Text>
              <ScrollView contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}>
                {step1Options.map(opt => (
                  <TouchableOpacity 
                    key={opt.id} 
                    onPress={() => setOpt1(opt)} 
                    className={`p-3 rounded-2xl border flex-row items-center gap-4 transition-all ${opt1?.id === opt.id ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-gray-100 shadow-sm'}`}
                  >
                    <Image source={{ uri: opt.image }} className="w-16 h-16 rounded-xl bg-gray-200" />
                    <Text className={`font-bold text-lg ${opt1?.id === opt.id ? 'text-indigo-900' : 'text-gray-700'}`}>{opt.label}</Text>
                    {opt1?.id === opt.id && <View className="ml-auto bg-indigo-500 rounded-full p-1"><Check size={14} color="white" /></View>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity disabled={!opt1} onPress={() => setStep(3)} className={`mt-4 h-14 rounded-2xl justify-center items-center shadow-md ${opt1 ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                <Text className={`font-bold text-lg ${opt1 ? 'text-white' : 'text-gray-400'}`}>Siguiente</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PASO 3: Selección Opción 2 (Grilla visual) */}
          {step === 3 && (
            <View className="flex-1">
              <Text className="text-gray-900 text-2xl font-bold mb-6 text-center">{step2Title}</Text>
              <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }} showsVerticalScrollIndicator={false}>
                {step2Options.map(opt => (
                  <TouchableOpacity 
                    key={opt.id} 
                    onPress={() => setOpt2(opt)} 
                    className={`w-[48%] aspect-square rounded-2xl overflow-hidden border-2 relative shadow-sm ${opt2?.id === opt.id ? 'border-indigo-500' : 'border-white'}`}
                  >
                    <Image source={{ uri: opt.image }} className="w-full h-full" />
                    {/* Overlay gradiente para leer el texto */}
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} className="absolute inset-0 justify-end p-3">
                        <Text className="text-white font-bold text-sm shadow-sm">{opt.label}</Text>
                    </LinearGradient>
                    {opt2?.id === opt.id && <View className="absolute top-2 right-2 bg-indigo-500 rounded-full p-1.5"><Check size={12} color="white" /></View>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity disabled={!opt2 || isProcessing} onPress={handleGenerate} className={`mt-4 h-14 rounded-2xl justify-center items-center shadow-lg ${opt2 ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                {isProcessing ? <ActivityIndicator color="white" /> : <Text className={`font-bold text-lg ${opt2 ? 'text-white' : 'text-gray-400'}`}>Generar ✨</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>

      <Modal visible={showPicker} transparent animationType="slide">
        {/* Modal estilo hoja inferior clara */}
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white p-6 rounded-t-[32px] gap-4 shadow-2xl">
            <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-2" />
            <Text className="text-gray-900 font-bold text-center text-xl mb-4">{t('common.select_image')}</Text>
            
            <TouchableOpacity onPress={() => pickImage(true)} className="bg-gray-50 p-4 rounded-2xl flex-row gap-4 items-center border border-gray-100">
                <View className="bg-white p-2 rounded-full shadow-sm"><Camera color="#4f46e5" size={24} /></View>
                <Text className="text-gray-900 font-bold text-lg">{t('common.camera')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => pickImage(false)} className="bg-gray-50 p-4 rounded-2xl flex-row gap-4 items-center border border-gray-100">
                <View className="bg-white p-2 rounded-full shadow-sm"><ImageIcon color="#4f46e5" size={24} /></View>
                <Text className="text-gray-900 font-bold text-lg">{t('common.gallery')}</Text>
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