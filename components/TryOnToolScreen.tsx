import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
// 1. Agregamos los nuevos iconos necesarios: Home, Palette, Image (ImageIcon)
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  Download, 
  Flag, 
  Home, 
  Image as ImageIcon, 
  Palette, 
  Share2, 
  Shirt, 
  Sparkles, 
  User, 
  X 
} from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateAIImage } from '../src/services/gemini';
import { reportContent } from '../src/services/reportService';

interface TryOnProps {
  title: string;
  subtitle: string;
  price: number;
  backgroundImage: string;
  // 2. Nuevas propiedades para hacerlo dinámico
  apiMode: string;        // 'tryon' o 'styletransfer'
  isInteriorMode?: boolean; // true para casas, false (o undefined) para ropa
}

export default function TryOnToolScreen({ 
  title, 
  subtitle, 
  price, 
  backgroundImage, 
  apiMode, 
  isInteriorMode = false 
}: TryOnProps) {
  const router = useRouter();
  const { t } = useTranslation();
  
  // --- ESTADOS ---
  const [userImage, setUserImage] = useState<string | null>(null);
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  
  const [activePicker, setActivePicker] = useState<'user' | 'garment' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const isReady = userImage !== null && garmentImage !== null;

  // --- LÓGICA DE SELECCIÓN ---
  const pickImage = async (useCamera: boolean) => {
    setShowSelectionModal(false);
    if (!activePicker) return;

    const permissionResult = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.status !== 'granted') {
      return Alert.alert(t('common.permissions_missing'), t('common.permissions_access'));
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, 
      quality: 0.8,
    };

    const result = useCamera 
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled) {
      if (activePicker === 'user') setUserImage(result.assets[0].uri);
      if (activePicker === 'garment') setGarmentImage(result.assets[0].uri);
    }
    setActivePicker(null);
  };

  const openPicker = (type: 'user' | 'garment') => {
    setActivePicker(type);
    setShowSelectionModal(true);
  };

  // --- GENERACIÓN ---
  const handleGenerate = async () => {
    if (!userImage || !garmentImage) return;
    setIsProcessing(true);
    try {
      // 3. CAMBIO CLAVE: Usamos 'apiMode' dinámico en lugar de 'tryon' fijo
      const generated = await generateAIImage(userImage, apiMode, null, garmentImage);
      if (generated) setResultImage(generated);
      else Alert.alert(t('common.error'), t('common.error_generation'));
    } catch (error: any) { 
      if (error.message === 'INSUFFICIENT_CREDITS') {
        Alert.alert(
          t('common.insufficient_title'),
          t('common.insufficient_msg'),
          [
            { text: t('common.cancel'), style: "cancel" },
            { 
              text: t('common.go_store'), 
              onPress: () => router.push('/(tabs)/store') 
            }
          ]
        );
      } else {
        Alert.alert(t('common.error'), t('common.error_connection'));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setResultImage(null);
    setUserImage(null);
    setGarmentImage(null);
  };

  const handleSave = async () => {
    if (!resultImage) return;
    setIsSaving(true);
    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      let finalStatus = status;

      if (status !== 'granted') {
        const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
        finalStatus = newStatus;
      }

      if (finalStatus !== 'granted') return Alert.alert(t('common.permission_denied'));

      // Usamos apiMode en el nombre del archivo para diferenciar
      const filename = FileSystem.cacheDirectory + `aura_${apiMode}_${Date.now()}.png`;
      const base64Code = resultImage.includes('base64,') ? resultImage.split('base64,')[1] : resultImage;
      await FileSystem.writeAsStringAsync(filename, base64Code, { encoding: 'base64' });
      await MediaLibrary.createAssetAsync(filename);
      Alert.alert(t('common.saved'), t('common.saved_msg'));
    } catch (error) { 
      Alert.alert(t('common.error'), t('common.error_technical')); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleShare = async () => {
    if (!resultImage) return;
    setIsSharing(true);
    try {
        const filename = FileSystem.cacheDirectory + `share_${apiMode}_${Date.now()}.png`;
        const base64Code = resultImage.includes('base64,') ? resultImage.split('base64,')[1] : resultImage;
        await FileSystem.writeAsStringAsync(filename, base64Code, { encoding: 'base64' });
        if (await Sharing.isAvailableAsync()) { await Sharing.shareAsync(filename); }
    } catch (error) { 
      Alert.alert(t('common.error'), t('common.share_error')); 
    } finally { 
      setIsSharing(false); 
    }
  };

  const handleReport = () => {
    Alert.alert(
      t('report.title'),
      t('report.msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('report.reason_nsfw'), 
          onPress: () => confirmReport('NSFW') 
        },
        { 
          text: t('report.reason_offensive'), 
          onPress: () => confirmReport('Offensive') 
        },
        { 
          text: t('report.reason_other'), 
          onPress: () => confirmReport('Other') 
        },
      ]
    );
  };

  const confirmReport = async (reason: string) => {
    // 4. CAMBIO CLAVE: Reportamos usando el apiMode correcto
    await reportContent(apiMode, reason, resultImage);
    setResultImage(null); 
  };

  if (resultImage) {
    return (
      <View className="flex-1 bg-black">
        <Image source={{ uri: resultImage }} className="absolute w-full h-full" resizeMode="contain" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} className="absolute bottom-0 w-full h-1/2" />
        <SafeAreaView className="flex-1 justify-between px-6 pb-8">

          <View className="flex-row justify-between items-start pt-4">
            <TouchableOpacity 
              onPress={handleReport}
              className="w-10 h-10 bg-black/40 rounded-full items-center justify-center border border-white/10"
            >
              <Flag size={20} color="#ef4444" />
            </TouchableOpacity>

            {/* 5. Etiqueta dinámica */}
            <View className="bg-purple-600 px-3 py-1 rounded-full border border-white/20">
              <Text className="text-white font-bold text-xs">
                {isInteriorMode ? "STYLE TRANSFER ✨" : "VIRTUAL TRY ON ✨"}
              </Text>
            </View>
          </View>

          <View>
            <Text className="text-white text-3xl font-bold text-center mb-6">{t('tryon_tool.result_title')}</Text>
            <View className="flex-row gap-4 mb-4">
              <TouchableOpacity onPress={handleShare} disabled={isSharing} className="flex-1 h-14 bg-zinc-800 rounded-2xl justify-center items-center border border-white/10">
                 {isSharing ? <ActivityIndicator color="white" /> : <><Share2 size={20} color="white" className="mr-2" /><Text className="text-white font-bold">{t('common.share')}</Text></>}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={isSaving} className="flex-1 h-14 bg-white rounded-2xl justify-center items-center shadow-lg">
                 {isSaving ? <ActivityIndicator color="black" /> : <><Download size={20} color="black" className="mr-2" /><Text className="text-black font-bold">{t('common.save')}</Text></>}
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={resetState} className="h-12 items-center justify-center"><Text className="text-zinc-500 font-bold">{t('tryon_tool.try_another')}</Text></TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0f0f0f]">
      <Image 
        source={{ uri: backgroundImage }} 
        className="absolute w-full h-full opacity-60" 
        blurRadius={20}
        resizeMode="cover"
      />
      <LinearGradient colors={['transparent', '#0f0f0f']} className="absolute w-full h-full" />

      <SafeAreaView className="flex-1 px-6">
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center border border-white/10">
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <View className="bg-black/40 px-3 py-1 rounded-full border border-white/10">
            <Text className="text-zinc-300 text-xs font-bold">{price} 💎</Text>
          </View>
        </View>

        <Text className="text-white text-3xl font-bold mb-2">{title}</Text>
        <Text className="text-zinc-300 text-lg mb-8">{subtitle}</Text>

        <View className="flex-1 gap-4">
          <TouchableOpacity 
            onPress={() => openPicker('user')}
            activeOpacity={0.9}
            className={`flex-1 rounded-3xl border-2 border-dashed relative overflow-hidden bg-black/40 backdrop-blur-xl ${userImage ? 'border-indigo-500' : 'border-white/20'}`}
          >
            {userImage ? (
              <>
                <Image source={{ uri: userImage }} className="w-full h-full opacity-80" resizeMode="contain" />
                <View className="absolute top-3 right-3 bg-indigo-500 rounded-full p-1"><CheckCircle2 size={16} color="white" /></View>
                <View className="absolute bottom-0 w-full bg-black/60 p-2 items-center">
                    {/* 6. Texto dinámico para la Foto 1 */}
                    <Text className="text-white font-bold text-xs">
                        {isInteriorMode ? t('styletransfer.room_photo') : t('tryon_tool.user_photo')}
                    </Text>
                </View>
              </>
            ) : (
              <View className="items-center justify-center h-full">
                <View className="w-16 h-16 bg-white/10 rounded-full items-center justify-center mb-3">
                    {/* 7. Icono dinámico para la Foto 1 */}
                    {isInteriorMode ? <Home size={32} color="#a1a1aa" /> : <User size={32} color="#a1a1aa" />}
                </View>
                <Text className="text-white font-bold text-lg">
                    {isInteriorMode ? t('styletransfer.step_1') : t('tryon_tool.step_1')}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View className="items-center -my-3 z-10">
            <View className="bg-transparent p-2 rounded-full">
               <View className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/10">
                  <Text className="text-white font-bold text-lg">+</Text>
               </View>
            </View>
          </View>

          {/* TARJETA 2: PRENDA / ESTILO */}
          <TouchableOpacity 
            onPress={() => openPicker('garment')}
            activeOpacity={0.9}
            className={`flex-1 rounded-3xl border-2 border-dashed relative overflow-hidden bg-black/40 backdrop-blur-xl ${garmentImage ? 'border-purple-500' : 'border-white/20'}`}
          >
            {garmentImage ? (
              <>
                <Image source={{ uri: garmentImage }} className="w-full h-full opacity-80" resizeMode="contain" />
                <View className="absolute top-3 right-3 bg-purple-500 rounded-full p-1"><CheckCircle2 size={16} color="white" /></View>
                <View className="absolute bottom-0 w-full bg-black/60 p-2 items-center">
                    {/* 8. Texto dinámico para la Foto 2 */}
                    <Text className="text-white font-bold text-xs">
                        {isInteriorMode ? t('styletransfer.style_photo') : t('tryon_tool.outfit_photo')}
                    </Text>
                </View>
              </>
            ) : (
              <View className="items-center justify-center h-full">
                <View className="w-16 h-16 bg-white/10 rounded-full items-center justify-center mb-3">
                    {/* 9. Icono dinámico para la Foto 2 */}
                    {isInteriorMode ? <Palette size={32} color="#a1a1aa" /> : <Shirt size={32} color="#a1a1aa" />}
                </View>
                <Text className="text-white font-bold text-lg">
                    {isInteriorMode ? t('styletransfer.step_2') : t('tryon_tool.step_2')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View className="py-6">
            <TouchableOpacity 
                disabled={!isReady || isProcessing}
                onPress={handleGenerate}
                className={`w-full h-16 rounded-2xl flex-row items-center justify-center shadow-lg 
                    ${isReady ? 'bg-indigo-500 shadow-indigo-500/40' : 'bg-white/10 opacity-50'}`}
            >
                {isProcessing ? (
                    <>
                        <ActivityIndicator color="white" className="mr-3" />
                        <Text className="text-white font-bold text-lg">{t('tryon_tool.btn_processing')}</Text>
                    </>
                ) : (
                    <>
                        <Sparkles size={24} color={isReady ? "white" : "#71717a"} className="mr-3" />
                        <Text className={`font-bold text-lg ${isReady ? 'text-white' : 'text-zinc-400'}`}>
                            {isReady ? t('tryon_tool.btn_ready') : t('tryon_tool.btn_not_ready')}
                        </Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modal visible={showSelectionModal} transparent animationType="slide">
         <TouchableOpacity style={{flex:1}} activeOpacity={1} onPress={() => setShowSelectionModal(false)}>
             <View className="flex-1 bg-black/60 justify-end">
                <View className="bg-[#1c1c1e] rounded-t-[32px] p-6 pb-12 border-t border-white/10">
                   <Text className="text-white text-xl font-bold text-center mb-6">{t('common.select_image')}</Text>
                   <TouchableOpacity onPress={() => pickImage(true)} className="bg-zinc-800 p-4 rounded-2xl mb-3 flex-row items-center"><Camera size={20} color="white" className="mr-4"/><Text className="text-white font-bold">{t('common.camera')}</Text></TouchableOpacity>
                   <TouchableOpacity onPress={() => pickImage(false)} className="bg-zinc-800 p-4 rounded-2xl mb-6 flex-row items-center"><Download size={20} color="white" className="mr-4"/><Text className="text-white font-bold">{t('common.gallery')}</Text></TouchableOpacity>
                   <TouchableOpacity onPress={() => setShowSelectionModal(false)} className="py-3 items-center"><Text className="text-zinc-400">{t('common.cancel')}</Text></TouchableOpacity>
                </View>
             </View>
         </TouchableOpacity>
      </Modal>
    </View>
  );
}