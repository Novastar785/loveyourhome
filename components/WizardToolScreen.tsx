import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { reportContent } from '../src/services/reportService';
import BeforeAfterSlider from './BeforeAfterSlider';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Camera, Check, Flag, Image as ImageIcon, Sparkles, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, Text, ImageSourcePropType, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateDesignImage } from '../src/services/designService';
import * as StoreReview from 'expo-store-review';
import * as Haptics from 'expo-haptics';

export interface WizardOption {
  id: string;
  label: string;
  image: string | ImageSourcePropType;
}

interface WizardProps {
  featureId: string;
  title: string;
  subtitle: string;
  backgroundImage: string | ImageSourcePropType;
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
  if (perm.status !== 'granted') {
    Alert.alert(t('common.permission_denied'));
    return;
  }
  try {
      const filename = FileSystem.cacheDirectory + `lyh_design_${Date.now()}.jpg`;
      const base64 = resultImage.split('base64,')[1];
      await FileSystem.writeAsStringAsync(filename, base64, { encoding: 'base64' });
      const asset = await MediaLibrary.createAssetAsync(filename);
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
    setStep(1);
    setSelectedImage(null);
    setOpt1(null);
    setOpt2(null);
    setResultImage(null);
  };

  if (step === 4 && resultImage) {
    return (
      <View className="flex-1 bg-black">
        {selectedImage ? (
           <BeforeAfterSlider beforeImage={selectedImage} afterImage={resultImage} />
        ) : (
           <Image source={{ uri: resultImage }} className="absolute w-full h-full" resizeMode="contain" />
        )}
        <SafeAreaView className="absolute w-full h-full flex-1 justify-between px-6 pb-8 pointer-events-box-none">
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
          <View className="flex-row gap-4" pointerEvents="box-none">
             <TouchableOpacity 
                onPress={handleSave} 
                accessibilityRole="button"
                accessibilityLabel={t('a11y.save_image')}
                className="flex-1 bg-white h-12 rounded-xl justify-center items-center shadow-lg"
              >
                <Text className="font-bold text-gray-900">{t('common.save')}</Text>
             </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Image 
  source={typeof backgroundImage === 'string' ? { uri: backgroundImage } : backgroundImage} 
  className="absolute w-full h-2/3 opacity-10" 
  blurRadius={40} 
/>
      <LinearGradient colors={['rgba(255,255,255,0)', '#ffffff']} className="absolute w-full h-full" />
      
      <SafeAreaView className="flex-1 px-6">
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity 
            onPress={() => step > 1 ? setStep(step - 1) : router.back()} 
            className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-200 shadow-sm"
            accessibilityRole="button"
            accessibilityLabel={t('a11y.go_back')}
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          
          <View className="flex-row gap-1">
            {[1, 2, 3].map(i => <View key={i} className={`h-1.5 rounded-full ${i <= step ? 'bg-indigo-500 w-6' : 'bg-gray-200 w-3'}`} />)}
          </View>
          <View className="w-10" />
        </View>

        <View className="flex-1">
          {step === 1 && (
            <View className="flex-1 justify-center">
              <Text className="text-gray-900 text-3xl font-bold text-center mb-2">{title}</Text>
              <Text className="text-gray-500 text-center mb-8">{subtitle}</Text>
              
              <TouchableOpacity 
                onPress={() => setShowPicker(true)} 
                className="aspect-[4/3] bg-gray-50 rounded-3xl border-2 border-dashed border-gray-300 items-center justify-center overflow-hidden relative shadow-sm"
                accessibilityRole="button"
                accessibilityLabel={selectedImage ? t('a11y.change_image') : t('a11y.select_image')}
              >
                {selectedImage ? 
                  <Image source={{ uri: selectedImage }} className="w-full h-full" resizeMode="contain" /> : 
                  <View className="items-center gap-3">
                    <View className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-sm">
                        <Camera size={32} color="#6366f1" />
                    </View>
                    <Text className="text-gray-500 font-medium">{t('common.upload_photo')}</Text>
                  </View>
                }
              </TouchableOpacity>

              <TouchableOpacity 
                disabled={!selectedImage} 
                onPress={() => setStep(2)} 
                className={`mt-8 h-14 rounded-2xl justify-center items-center shadow-lg ${selectedImage ? 'bg-indigo-600' : 'bg-gray-200'}`}
                accessibilityRole="button"
                accessibilityLabel={t('common.next')}
                accessibilityState={{ disabled: !selectedImage }}
              >
                <Text className={`font-bold text-lg ${selectedImage ? 'text-white' : 'text-gray-400'}`}>{t('common.next')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View className="flex-1">
              <Text className="text-gray-900 text-2xl font-bold mb-6 text-center">{step1Title}</Text>
              <ScrollView contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}>
                {step1Options.map(opt => (
                  <TouchableOpacity 
                    key={opt.id} 
                    onPress={() => setOpt1(opt)} 
                    className={`p-3 rounded-2xl border flex-row items-center gap-4 transition-all ${opt1?.id === opt.id ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-gray-100 shadow-sm'}`}
                    // --- ACCESIBILIDAD LISTA 1 ---
                    accessibilityRole="radio"
                    accessibilityState={{ checked: opt1?.id === opt.id }}
                    accessibilityLabel={opt.label}
                  >
                    <Image 
  source={typeof opt.image === 'string' ? { uri: opt.image } : opt.image} 
  className="w-32 h-32 rounded-xl bg-gray-200" 
/>
                    <Text className={`font-bold text-lg ${opt1?.id === opt.id ? 'text-indigo-900' : 'text-gray-700'}`}>{opt.label}</Text>
                    {opt1?.id === opt.id && <View className="ml-auto bg-indigo-500 rounded-full p-1"><Check size={14} color="white" /></View>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                disabled={!opt1} 
                onPress={() => setStep(3)} 
                className={`mt-4 h-14 rounded-2xl justify-center items-center shadow-md ${opt1 ? 'bg-indigo-600' : 'bg-gray-200'}`}
                accessibilityRole="button"
                accessibilityLabel={t('common.next')}
                accessibilityState={{ disabled: !opt1 }}
              >
                <Text className={`font-bold text-lg ${opt1 ? 'text-white' : 'text-gray-400'}`}>{t('common.next')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View className="flex-1">
              <Text className="text-gray-900 text-2xl font-bold mb-6 text-center">{step2Title}</Text>
              <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }} showsVerticalScrollIndicator={false}>
                {step2Options.map(opt => (
                  <TouchableOpacity 
                    key={opt.id} 
                    onPress={() => setOpt2(opt)} 
                    className={`w-[48%] aspect-square rounded-2xl overflow-hidden border-2 relative shadow-sm ${opt2?.id === opt.id ? 'border-indigo-500' : 'border-white'}`}
                    // --- ACCESIBILIDAD LISTA 2 ---
                    accessibilityRole="radio"
                    accessibilityState={{ checked: opt2?.id === opt.id }}
                    accessibilityLabel={opt.label}
                  >
                    <Image 
  source={typeof opt.image === 'string' ? { uri: opt.image } : opt.image} 
  className="w-full h-full" 
/>
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} className="absolute inset-0 justify-end p-3">
                        <Text className="text-white font-bold text-sm shadow-sm">{opt.label}</Text>
                    </LinearGradient>
                    {opt2?.id === opt.id && <View className="absolute top-2 right-2 bg-indigo-500 rounded-full p-1.5"><Check size={12} color="white" /></View>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                disabled={!opt2 || isProcessing} 
                onPress={handleGenerate} 
                className={`mt-4 h-14 rounded-2xl justify-center items-center shadow-lg ${opt2 ? 'bg-indigo-600' : 'bg-gray-200'}`}
                accessibilityRole="button"
                accessibilityLabel={t('generic_tool.generate_btn')}
                accessibilityState={{ disabled: !opt2 || isProcessing }}
              >
                {isProcessing ? <ActivityIndicator color="white" /> : <Text className={`font-bold text-lg ${opt2 ? 'text-white' : 'text-gray-400'}`}>{t('generic_tool.generate_btn')} ✨</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>

      <Modal visible={showPicker} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white p-6 rounded-t-[32px] gap-4 shadow-2xl">
            <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-2" />
            <Text className="text-gray-900 font-bold text-center text-xl mb-4">{t('common.select_image')}</Text>
            
            <TouchableOpacity onPress={() => pickImage(true)} className="bg-gray-50 p-4 rounded-2xl flex-row gap-4 items-center border border-gray-100" accessibilityRole="button" accessibilityLabel={t('common.camera')}>
                <View className="bg-white p-2 rounded-full shadow-sm"><Camera color="#4f46e5" size={24} /></View>
                <Text className="text-gray-900 font-bold text-lg">{t('common.camera')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => pickImage(false)} className="bg-gray-50 p-4 rounded-2xl flex-row gap-4 items-center border border-gray-100" accessibilityRole="button" accessibilityLabel={t('common.gallery')}>
                <View className="bg-white p-2 rounded-full shadow-sm"><ImageIcon color="#4f46e5" size={24} /></View>
                <Text className="text-gray-900 font-bold text-lg">{t('common.gallery')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowPicker(false)} className="p-4 items-center mt-2" accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
                <Text className="text-gray-400 font-bold text-base">{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}