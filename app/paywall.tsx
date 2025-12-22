import React from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { CustomerInfo } from 'react-native-purchases';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'; 

// 1. IMPORTANTE: Importamos la función de sincronización
import { initializeUser } from '../src/services/user'; 

export default function PaywallScreen() {
  const router = useRouter();

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('HAS_SEEN_ONBOARDING', 'true');
      router.replace('/(tabs)');
    } catch (e) {
      console.error("Error guardando onboarding status:", e);
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <RevenueCatUI.Paywall
        // 2. Convertimos a async para esperar la sincronización
        onPurchaseCompleted={async ({ customerInfo }: { customerInfo: CustomerInfo }) => {
          console.log("Compra completada:", customerInfo);
          
          // 3. Sincronizamos por si RevenueCat cambió el ID (CRÍTICO)
          await initializeUser(); 
          
          handleFinish();
        }}
        // 4. Lo mismo para la restauración
        onRestoreCompleted={async ({ customerInfo }: { customerInfo: CustomerInfo }) => {
          console.log("Restauración completada:", customerInfo);

          // 5. Sincronizamos ID recuperado
          await initializeUser();

          Alert.alert("Restaurado", "Tus compras se han restaurado correctamente.");
          handleFinish();
        }}
        onDismiss={() => {
          handleFinish();
        }}
        options={{
          displayCloseButton: true, 
        }}
      />

      {/* --- BOTÓN DE CERRAR MANUAL (TU CÓDIGO INTACTO) --- */}
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={handleFinish}
        activeOpacity={0.8}
      >
        <Ionicons name="close-circle" size={32} color="#fff" style={styles.shadow} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', 
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30, 
    left: 20, 
    zIndex: 999,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
  }
});