import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import Purchases from 'react-native-purchases';
import { supabase } from '../config/supabase';
import i18n from '../i18n';

const compressForDesign = async (uri: string): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (e) {
    return uri;
  }
};

export interface DesignRequest {
  imageUri: string;
  featureId: string;
  option1Id?: string;
  option2Id?: string;
  // 👇 NUEVO: Soporte para segunda imagen (opcional)
  secondaryImageUri?: string; 
}

export const generateDesignImage = async (req: DesignRequest): Promise<string> => {
  try {
    const appUserID = await Purchases.getAppUserID();
    if (!appUserID) throw new Error(i18n.t('errors.user_id_missing'));

    console.log("🎨 [DesignService] Procesando imagen principal...");
    const optimizedUri = await compressForDesign(req.imageUri);
    const base64 = await FileSystem.readAsStringAsync(optimizedUri, { encoding: 'base64' });

    // 👇 NUEVO: Procesar segunda imagen si existe
    let secondaryBase64 = null;
    if (req.secondaryImageUri) {
       console.log("🎨 [DesignService] Procesando imagen secundaria...");
       const optimizedSecUri = await compressForDesign(req.secondaryImageUri);
       secondaryBase64 = await FileSystem.readAsStringAsync(optimizedSecUri, { encoding: 'base64' });
    }

    const { data, error } = await supabase.functions.invoke('generate-design', {
      body: {
        user_id: appUserID,
        imageBase64: base64,
        secondaryImageBase64: secondaryBase64, // 👈 Enviamos la segunda imagen
        feature_id: req.featureId,
        option1_id: req.option1Id,
        option2_id: req.option2Id
      }
    });

    if (error) throw error;
    
    if (data?.error) {
      if (data.code === 'INSUFFICIENT_CREDITS') throw new Error("INSUFFICIENT_CREDITS");
      throw new Error(data.error);
    }

    if (!data?.image) throw new Error(i18n.t('errors.no_image_returned'));

    return data.image;

  } catch (error: any) {
    console.error("❌ Error DesignService:", error);
    throw error;
  }
};