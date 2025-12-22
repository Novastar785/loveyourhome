import { DefaultTheme, Theme, ThemeProvider } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import LottieView from 'lottie-react-native';
import { initializeUser } from '../src/services/user';
import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View, StatusBar } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as QuickActions from 'expo-quick-actions';
import { useQuickActionRouting } from 'expo-quick-actions/router';
// --- IMPORTANTE: Importar hook de traducción ---
import { useTranslation } from 'react-i18next';

// 👇 FIX: Imports necesarios para el LinearGradient en producción
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';

import { REVENUECAT_API_KEY } from '../src/config/secrets';
import "../src/i18n/index";
import "./global.css";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});
SplashScreen.preventAutoHideAsync();

// 👇 FIX: Configuración global para que LinearGradient acepte className
cssInterop(LinearGradient, {
  className: {
    target: "style",
  },
});

const GlassyTheme: Theme = {
  ...DefaultTheme, 
  colors: {
    ...DefaultTheme.colors,
    background: '#F5F3FF',
    card: '#ffffff',       
    text: '#111827',       
    border: '#E5E7EB',     
    primary: '#4F46E5',    
  },
};

export default function Layout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(false);
  const animationRef = useRef<LottieView>(null);
  const router = useRouter();
  
  // --- USO DE TRADUCCIÓN ---
  const { t, i18n } = useTranslation();

  useQuickActionRouting();

  // Actualizar Quick Actions cuando cambie el idioma (i18n.language)
  useEffect(() => {
    QuickActions.setItems([
      {
        type: 'action_design',
        title: t('quick_actions.new_design_title'), // Traducido
        subtitle: t('quick_actions.new_design_subtitle'), // Traducido
        icon: 'compose', 
        id: 'design',
        params: { href: '/features/interiordesign' },
      },
      {
        type: 'action_store',
        title: t('quick_actions.store_title'), // Traducido
        subtitle: t('quick_actions.store_subtitle'), // Traducido
        icon: 'cart',
        id: 'store',
        params: { href: '/(tabs)/store' },
      },
    ]);
  }, [i18n.language]); // Dependencia clave

  useEffect(() => {
    async function prepare() {
      try {
        if (Platform.OS === 'android') {
          await SystemUI.setBackgroundColorAsync("#F5F3FF");
          await NavigationBar.setVisibilityAsync("hidden");
          StatusBar.setHidden(true);
          await NavigationBar.setBehaviorAsync("overlay-swipe");
          await NavigationBar.setBackgroundColorAsync("transparent");
          await NavigationBar.setButtonStyleAsync("dark"); 
          StatusBar.setBarStyle("dark-content");
        }

           const hasSeenOnboarding = await AsyncStorage.getItem('HAS_SEEN_ONBOARDING');
           setIsFirstLaunch(hasSeenOnboarding !== 'true');

        
        if (REVENUECAT_API_KEY) {
          await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        }

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

  useEffect(() => {
    if (appIsReady && isFirstLaunch) {
        router.replace('/onboarding');
    }
  }, [appIsReady, isFirstLaunch]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={GlassyTheme}>
        <View style={{ flex: 1 }}>
            <Stack 
              screenOptions={{ 
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' }, 
                animation: 'fade', 
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen 
                name="paywall" 
                options={{ 
                  headerShown: false, 
                  presentation: 'modal', 
                  animation: 'slide_from_bottom'
                }} 
              />
            </Stack>

            {(!appIsReady || !splashAnimationFinished) && (
              <View style={[styles.splashContainer, { backgroundColor: '#ffffff' }]}>
                <LottieView
                  ref={animationRef}
                  source={require('../assets/animations/splash-animation.json')}
                  autoPlay={false} 
                  loop={false}
                  resizeMode="cover"
                  onAnimationFinish={() => setSplashAnimationFinished(true)}
                  style={styles.lottie}
                />
              </View>
            )}
        </View>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: 250, 
    height: 250,
  },
});