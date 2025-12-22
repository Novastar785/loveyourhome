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
    
    // Limpieza: Borramos las marcas de este usuario para permitir un futuro registro limpio
    await AsyncStorage.removeItem(`INIT_${appUserID}`);
    await AsyncStorage.removeItem('IS_USER_INITIALIZED');
    
  } catch (e: any) {
    console.error("Error deleting account:", e);
    Alert.alert(i18n.t('common.error'), i18n.t('profile.delete_error'));
  }
};

export const initializeUser = async () => {
  try {
    // 1. Obtener ID actual de RevenueCat (Fundamental hacerlo primero)
    const appUserID = await Purchases.getAppUserID();
    console.log("Sincronizando usuario:", appUserID);

    // 2. Verificación INTELIGENTE:
    // En lugar de un bloqueo global, verificamos si ESTE ID específico ya fue sincronizado.
    // Esto permite que si el ID cambia (Paywall/Restore), el código siga ejecutándose.
    const initKey = `INIT_${appUserID}`;
    const isInitialized = await AsyncStorage.getItem(initKey);
    
    if (isInitialized === 'true') {
      return; 
    }

    // 3. LLAMADA A LA FUNCIÓN SEGURA (RPC)
    // Ya no hacemos SELECT ni INSERT manual. La base de datos decide.
    const { data, error } = await supabase.rpc('initialize_new_user', {
      p_user_id: appUserID
    });

    if (error) {
      // Si falla la conexión, NO guardamos el flag local para que lo intente 
      // de nuevo la próxima vez que abra la app o cambie de pantalla.
      console.error("Error llamando a RPC initialize_new_user:", error);
      return;
    }

    // 4. Gestionar el resultado
    // La función SQL devuelve { success: true } si fue creado y recibió regalo.
    if (data && data.success) {
      console.log("¡Usuario nuevo creado exitosamente!");
      
      // Mensaje de bienvenida
      Alert.alert(
        i18n.t('common.welcome_title'), 
        i18n.t('common.welcome_gift_msg')
      );
    } else {
      console.log("El usuario ya existía y está sincronizado.");
    }

    // 5. Guardar marca local VINCULADA al ID actual
    await AsyncStorage.setItem(initKey, 'true');
    
    // Mantenemos la marca global por compatibilidad, pero ya no bloquea la lógica crítica
    await AsyncStorage.setItem('IS_USER_INITIALIZED', 'true');

  } catch (e) {
    console.error("Error crítico en initializeUser:", e);
  }
};