import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Check, Download, Flag, Home, Image as ImageIcon, Palette, Sparkles, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateDesignImage } from '../src/services/designService';

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
    setActivePicker(slot);
    setShowPicker(true);
  };

  const handleGenerate = async () => {
    if (!img1 || !img2) return;
    
    setIsProcessing(true);
    try {
      const result = await generateDesignImage({
        imageUri: img1,
        secondaryImageUri: img2, // Enviamos la segunda imagen
        featureId: featureId
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
        const filename = FileSystem.cacheDirectory + `aura_style_${Date.now()}.jpg`;
        const base64 = resultImage.split('base64,')[1];
        await FileSystem.writeAsStringAsync(filename, base64, { encoding: 'base64' });
        await MediaLibrary.createAssetAsync(filename);
        Alert.alert(t('common.saved'));
    } catch(e) { Alert.alert("Error saving"); }
  };

  const reset = () => {
    setResultImage(null);
    setImg1(null);
    setImg2(null);
  };

  if (resultImage) {
    return (
      <View className="flex-1 bg-black">
        <Image source={{ uri: resultImage }} className="absolute w-full h-full" resizeMode="contain" />
        <SafeAreaView className="flex-1 justify-between px-6 pb-8">
          <View className="flex-row justify-between pt-4">
             <TouchableOpacity onPress={() => Alert.alert("Reported")} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center"><Flag size={20} color="#ef4444" /></TouchableOpacity>
             <TouchableOpacity onPress={reset} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center"><X size={20} color="white" /></TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleSave} className="bg-white h-14 rounded-xl justify-center items-center"><Text className="font-bold text-black">{t('common.save')}</Text></TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0f0f0f]">
      <Image source={{ uri: backgroundImage }} className="absolute w-full h-full opacity-40" blurRadius={30} resizeMode="cover" />
      <SafeAreaView className="flex-1 px-6">
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center"><ArrowLeft size={20} color="white" /></TouchableOpacity>
          <View className="bg-black/40 px-3 py-1 rounded-full"><Text className="text-zinc-300 text-xs font-bold">{price} 💎</Text></View>
        </View>

        <Text className="text-white text-3xl font-bold mb-2">{title}</Text>
        <Text className="text-zinc-400 text-lg mb-8">{subtitle}</Text>

        <View className="flex-1 gap-4">
          {/* SLOT 1 */}
          <TouchableOpacity onPress={() => openPicker(1)} className={`flex-1 bg-zinc-900/60 rounded-3xl border-2 border-dashed ${img1 ? 'border-indigo-500' : 'border-zinc-700'} items-center justify-center relative overflow-hidden`}>
            {img1 ? <Image source={{ uri: img1 }} className="w-full h-full opacity-80" /> : <View className="items-center"><Home size={32} color="#a1a1aa" /><Text className="text-zinc-400 font-bold mt-2">{label1}</Text></View>}
            {img1 && <View className="absolute top-2 right-2 bg-indigo-500 p-1 rounded-full"><Check size={12} color="white" /></View>}
          </TouchableOpacity>

          {/* SLOT 2 */}
          <TouchableOpacity onPress={() => openPicker(2)} className={`flex-1 bg-zinc-900/60 rounded-3xl border-2 border-dashed ${img2 ? 'border-purple-500' : 'border-zinc-700'} items-center justify-center relative overflow-hidden`}>
            {img2 ? <Image source={{ uri: img2 }} className="w-full h-full opacity-80" /> : <View className="items-center"><Palette size={32} color="#a1a1aa" /><Text className="text-zinc-400 font-bold mt-2">{label2}</Text></View>}
            {img2 && <View className="absolute top-2 right-2 bg-purple-500 p-1 rounded-full"><Check size={12} color="white" /></View>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          disabled={!img1 || !img2 || isProcessing}
          onPress={handleGenerate}
          className={`my-8 h-16 rounded-2xl flex-row items-center justify-center ${img1 && img2 ? 'bg-indigo-500' : 'bg-zinc-800 opacity-50'}`}
        >
          {isProcessing ? <ActivityIndicator color="white" /> : <><Sparkles size={24} color="white" className="mr-2" /><Text className="text-white font-bold text-lg">Transferir Estilo</Text></>}
        </TouchableOpacity>
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