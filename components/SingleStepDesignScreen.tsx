import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Check, Download, Flag, Image as ImageIcon, Sparkles, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateDesignImage } from '../src/services/designService';

export interface DesignOption {
  id: string; // ID en la base de datos (ej: 'garden_zen')
  label: string;
  image: string;
}

interface SingleStepProps {
  featureId: string; // 'gardendesign'
  title: string;
  subtitle: string;
  price: number;
  backgroundImage: string;
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
    
    setIsProcessing(true);
    try {
      // Usamos el servicio nuevo. Enviamos el estilo como option1Id
      const result = await generateDesignImage({
        imageUri: selectedImage,
        featureId: featureId,
        option1Id: selectedOption
      });
      setResultImage(result);
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
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (perm.status !== 'granted') return;
    try {
        const filename = FileSystem.cacheDirectory + `aura_garden_${Date.now()}.jpg`;
        const base64 = resultImage.split('base64,')[1];
        await FileSystem.writeAsStringAsync(filename, base64, { encoding: 'base64' });
        await MediaLibrary.createAssetAsync(filename);
        Alert.alert(t('common.saved'));
    } catch(e) { Alert.alert("Error saving"); }
  };

  const reset = () => {
    setResultImage(null);
    setSelectedImage(null);
  };

  // RESULTADO
  if (resultImage) {
    return (
      <View className="flex-1 bg-black">
        <Image source={{ uri: resultImage }} className="absolute w-full h-full" resizeMode="contain" />
        <SafeAreaView className="flex-1 justify-between px-6 pb-8">
          <View className="flex-row justify-between pt-4">
             <TouchableOpacity onPress={() => Alert.alert("Reported")} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center"><Flag size={20} color="#ef4444" /></TouchableOpacity>
             <TouchableOpacity onPress={reset} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center"><X size={20} color="white" /></TouchableOpacity>
          </View>
          <View className="flex-row gap-4">
             <TouchableOpacity onPress={handleSave} className="flex-1 bg-white h-12 rounded-xl justify-center items-center"><Text className="font-bold text-black">{t('common.save')}</Text></TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // SELECCIÓN
  return (
    <View className="flex-1 bg-[#0f0f0f]">
      <Image source={{ uri: selectedImage || backgroundImage }} className="absolute w-full h-full opacity-40" blurRadius={selectedImage ? 0 : 30} resizeMode="cover" />
      <LinearGradient colors={['transparent', '#0f0f0f']} className="absolute w-full h-full" />
      
      <SafeAreaView className="flex-1 px-6">
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center">
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          {selectedImage && <TouchableOpacity onPress={() => setSelectedImage(null)} className="bg-black/40 px-3 py-1 rounded-full"><Text className="text-white text-xs">{t('common.cancel')}</Text></TouchableOpacity>}
        </View>

        <View className="flex-1 justify-end pb-8">
          {!selectedImage ? (
            <View>
              <Text className="text-white text-4xl font-bold mb-2">{title}</Text>
              <Text className="text-zinc-400 text-lg mb-8">{subtitle}</Text>
              <TouchableOpacity onPress={() => setShowPicker(true)} className="h-16 bg-indigo-500 rounded-2xl flex-row items-center justify-center shadow-lg">
                <Camera size={24} color="white" className="mr-3" />
                <Text className="text-white font-bold text-lg">{t('common.upload_photo')} ({price} 💎)</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-black/80 p-6 rounded-3xl border border-white/10">
               <Text className="text-zinc-400 text-xs font-bold mb-3 uppercase tracking-widest">{selectionTitle || t('generic_tool.choose_style')}</Text>
               
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                 {options.map((opt) => (
                   <TouchableOpacity key={opt.id} onPress={() => setSelectedOption(opt.id)} activeOpacity={0.8} className="relative">
                     <View className={`w-24 h-32 rounded-xl overflow-hidden border-2 ${selectedOption === opt.id ? 'border-indigo-500' : 'border-white/20'}`}>
                       <Image source={{ uri: opt.image }} className="w-full h-full" />
                       <View className="absolute inset-0 bg-black/30" />
                     </View>
                     <Text className={`absolute bottom-2 w-full text-center text-xs font-bold ${selectedOption === opt.id ? 'text-white' : 'text-zinc-300'}`}>{opt.label}</Text>
                     {selectedOption === opt.id && <View className="absolute top-2 right-2 bg-indigo-500 p-1 rounded-full"><Sparkles size={10} color="white" /></View>}
                   </TouchableOpacity>
                 ))}
               </ScrollView>

               <TouchableOpacity 
                 disabled={isProcessing} 
                 onPress={handleGenerate} 
                 className={`mt-6 h-14 rounded-xl flex-row items-center justify-center ${isProcessing ? 'bg-zinc-700' : 'bg-indigo-500'}`}
               >
                 {isProcessing ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">{t('generic_tool.generate_btn')}</Text>}
               </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>

      <Modal visible={showPicker} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-zinc-900 p-6 rounded-t-3xl gap-4">
            <Text className="text-white font-bold text-center text-lg mb-2">{t('common.select_image')}</Text>
            <TouchableOpacity onPress={() => pickImage(true)} className="bg-zinc-800 p-4 rounded-xl flex-row gap-3"><Camera color="white" /><Text className="text-white font-bold">{t('common.camera')}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => pickImage(false)} className="bg-zinc-800 p-4 rounded-xl flex-row gap-3"><ImageIcon color="white" /><Text className="text-white font-bold">{t('common.gallery')}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPicker(false)} className="p-4 items-center"><Text className="text-zinc-500 font-bold">{t('common.cancel')}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}