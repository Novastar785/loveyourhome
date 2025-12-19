import { DefaultTheme, Theme, ThemeProvider } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import LottieView from 'lottie-react-native';
import { initializeUser } from '../src/services/user';
import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View, StatusBar } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Purchases from 'react-native-purchases';

// --- IMPORTACIONES ORIGINALES ---
import { REVENUECAT_API_KEY } from '../src/config/secrets';
import "../src/i18n/index";
import "./global.css";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

// Silencia la advertencia de escritura en render (Falso positivo común)
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Desactiva el modo estricto para evitar el aviso "Writing to value..."
});
SplashScreen.preventAutoHideAsync();

// Definimos el Tema "Glassy Light" usando variables compatibles
const GlassyTheme: Theme = {
  ...DefaultTheme, 
  colors: {
    ...DefaultTheme.colors,
    background: '#F5F3FF', // Coincide con bg-violet-50
    card: '#ffffff',       
    text: '#111827',       // Coincide con text-gray-900
    border: '#E5E7EB',     // Coincide con border-gray-200
    primary: '#4F46E5',    // Coincide con text-indigo-600
  },
};

export default function Layout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    async function prepare() {
      try {
        // 1. Ajustes de UI (Android)
        if (Platform.OS === 'android') {
          await SystemUI.setBackgroundColorAsync("#F5F3FF");
          await NavigationBar.setVisibilityAsync("hidden");
          StatusBar.setHidden(true);
          await NavigationBar.setBehaviorAsync("overlay-swipe");
          await NavigationBar.setBackgroundColorAsync("transparent");
          await NavigationBar.setButtonStyleAsync("dark"); 
          StatusBar.setBarStyle("dark-content");
        }

        // 2. Configurar RevenueCat PRIMERO
        if (REVENUECAT_API_KEY) {
          await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
          console.log("RevenueCat configurado");
        }

        // 3. Inicializar usuario en la DB (Ahora que RevenueCat está listo)
        // Lo llamamos sin 'await' si no quieres que bloquee el splash screen,
        // o con 'await' si quieres asegurar que el usuario exista antes de que entre a la app.
        await initializeUser(); 

      } catch (e) {
        console.warn("Error en la preparación:", e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
      if (Platform.OS === 'android') {
        setTimeout(() => animationRef.current?.play(), 50);
      } else {
        animationRef.current?.play();
      }
    }
  }, [appIsReady]);

  if (!appIsReady || !animationFinished) {
    // Usamos estilo inline aquí solo porque styles.container está definido abajo y es un splash nativo
    return (
      <View style={[styles.container, { backgroundColor: '#ffffff' }]}>
        <LottieView
          ref={animationRef}
          source={require('../assets/animations/splash-animation.json')}
          autoPlay={false} 
          loop={false}
          resizeMode="cover"
          onAnimationFinish={() => setAnimationFinished(true)}
          style={styles.lottie}
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={GlassyTheme}>
        <Stack 
          screenOptions={{ 
            headerShown: false,
            // Usamos transparent para que el gradiente de fondo de las pantallas (index/profile) sea visible
            contentStyle: { backgroundColor: 'transparent' }, 
            animation: 'fade', 
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: 250, 
    height: 250,
  },
});