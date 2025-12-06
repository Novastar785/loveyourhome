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
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (perm.status !== 'granted') return;
    try {
        const filename = FileSystem.cacheDirectory + `aura_${Date.now()}.jpg`;
        const base64 = resultImage.split('base64,')[1];
        await FileSystem.writeAsStringAsync(filename, base64, { encoding: 'base64' });
        await MediaLibrary.createAssetAsync(filename);
        Alert.alert(t('common.saved'));
    } catch(e) { Alert.alert("Error saving"); }
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

  return (
    <View className="flex-1 bg-[#0f0f0f]">
      <Image source={{ uri: backgroundImage }} className="absolute w-full h-full opacity-20" blurRadius={30} />
      <SafeAreaView className="flex-1 px-6">
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center">
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <View className="flex-row gap-1">
            {[1, 2, 3].map(i => <View key={i} className={`h-1.5 rounded-full ${i <= step ? 'bg-indigo-500 w-6' : 'bg-zinc-700 w-3'}`} />)}
          </View>
          <View className="w-10" />
        </View>

        <View className="flex-1">
          {step === 1 && (
            <View className="flex-1 justify-center">
              <Text className="text-white text-3xl font-bold text-center mb-2">{title}</Text>
              <Text className="text-zinc-400 text-center mb-8">{subtitle}</Text>
              <TouchableOpacity onPress={() => setShowPicker(true)} className="aspect-[3/4] bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-700 items-center justify-center overflow-hidden">
                {selectedImage ? <Image source={{ uri: selectedImage }} className="w-full h-full" /> : <View className="items-center"><Camera size={40} color="#52525b" /><Text className="text-zinc-500 mt-2 font-bold">{t('common.upload_photo')}</Text></View>}
              </TouchableOpacity>
              <TouchableOpacity disabled={!selectedImage} onPress={() => setStep(2)} className={`mt-8 h-14 rounded-full justify-center items-center ${selectedImage ? 'bg-indigo-500' : 'bg-zinc-800'}`}>
                <Text className="text-white font-bold">Siguiente</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold mb-6 text-center">{step1Title}</Text>
              <ScrollView contentContainerStyle={{ gap: 12 }}>
                {step1Options.map(opt => (
                  <TouchableOpacity key={opt.id} onPress={() => setOpt1(opt)} className={`p-4 rounded-xl border flex-row items-center gap-4 ${opt1?.id === opt.id ? 'bg-indigo-500/20 border-indigo-500' : 'bg-zinc-900 border-zinc-800'}`}>
                    <Image source={{ uri: opt.image }} className="w-16 h-16 rounded-lg" />
                    <Text className="text-white font-bold text-lg">{opt.label}</Text>
                    {opt1?.id === opt.id && <Check size={20} color="#818cf8" style={{ marginLeft: 'auto' }} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity disabled={!opt1} onPress={() => setStep(3)} className={`mt-4 h-14 rounded-full justify-center items-center ${opt1 ? 'bg-indigo-500' : 'bg-zinc-800'}`}>
                <Text className="text-white font-bold">Siguiente</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold mb-6 text-center">{step2Title}</Text>
              <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {step2Options.map(opt => (
                  <TouchableOpacity key={opt.id} onPress={() => setOpt2(opt)} className={`w-[48%] aspect-square rounded-2xl overflow-hidden border-2 ${opt2?.id === opt.id ? 'border-indigo-500' : 'border-transparent'}`}>
                    <Image source={{ uri: opt.image }} className="w-full h-full" />
                    <View className="absolute inset-0 bg-black/40 justify-end p-3">
                      <Text className="text-white font-bold">{opt.label}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity disabled={!opt2 || isProcessing} onPress={handleGenerate} className={`mt-4 h-14 rounded-full justify-center items-center ${opt2 ? 'bg-indigo-500' : 'bg-zinc-800'}`}>
                {isProcessing ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Generar ✨</Text>}
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