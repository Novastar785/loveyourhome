// src/services/user.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import Purchases from 'react-native-purchases';
import { supabase } from '../config/supabase';
import i18n from '../i18n';

export const deleteAccount = async () => {
  try {
    const appUserID = await Purchases.getAppUserID();
    
    // 1. Borrar datos en Supabase
    const { error } = await supabase.rpc('delete_user_account', {
      target_user_id: appUserID
    });

    if (error) throw error;

    // 2. Resetear RevenueCat (Crea un nuevo ID anónimo limpio)
    if (!Purchases.isAnonymous) {
        await Purchases.logOut();
    } 
    // await Purchases.reset(); 

    Alert.alert(
      i18n.t('profile.account_deleted_title'), 
      i18n.t('profile.account_deleted_msg')
    );
    
  } catch (e: any) {
    console.error("Error deleting account:", e);
    Alert.alert(i18n.t('common.error'), i18n.t('profile.delete_error'));
  }
};

export const initializeUser = async () => {
  try {
    // 1. Verificación local rápida (Igual que antes)
    const isInitialized = await AsyncStorage.getItem('IS_USER_INITIALIZED');
    if (isInitialized === 'true') {
      return; 
    }

    // 2. Obtener ID de RevenueCat
    const appUserID = await Purchases.getAppUserID();
    console.log("Intentando inicializar usuario vía RPC:", appUserID);

    // 3. LLAMADA A LA FUNCIÓN SEGURA (RPC)
    // Ya no hacemos SELECT ni INSERT manual. La base de datos decide.
    const { data, error } = await supabase.rpc('initialize_new_user', {
      p_user_id: appUserID
    });

    if (error) {
      // Si falla la conexión, NO guardamos el flag local para que lo intente 
      // de nuevo la próxima vez que abra la app.
      console.error("Error llamando a RPC initialize_new_user:", error);
      return;
    }

    // 4. Gestionar el resultado
    // La función SQL devuelve { success: true } si fue creado y recibió regalo.
    if (data && data.success) {
      console.log("¡Usuario nuevo creado exitosamente!");
      
      // Mensaje de bienvenida
      Alert.alert(
        "¡Welcome to Love Your Home!", 
        "As a welcome gift, we've added 3 free credits to your account. Enjoy exploring Love Your Home!"
      );
    } else {
      console.log("El usuario ya existía (o la DB lo reportó como existente).");
    }

    // 5. Guardar marca local para no volver a ejecutar esto
    await AsyncStorage.setItem('IS_USER_INITIALIZED', 'true');

  } catch (e) {
    console.error("Error crítico en initializeUser:", e);
  }
};