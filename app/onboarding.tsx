import React, { useRef, useState, useEffect } from 'react';
import { View, Text, FlatList, Dimensions, Image, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next'; 
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence, 
  Easing, 
  FadeInDown,
  withDelay
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// --- COMPONENTE: Slider Antes/Después ---
const AutoCompareSlider = () => {
  const { t } = useTranslation(); 
  const progress = useSharedValue(0); 

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, 
      true 
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const lineStyle = useAnimatedStyle(() => ({
    left: `${progress.value * 100}%`,
  }));

  return (
    <View className="w-full h-[480px] relative rounded-3xl overflow-hidden shadow-sm bg-gray-100 mt-6">
      <Image 
        source={require('../assets/images/onboarding-after.jpg')} 
        className="w-full h-full object-cover"
      />
      
      {/* BADGE ANTES */}
      <View className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full z-20">
        <Text className="text-white text-xs font-bold tracking-wide">
          {t('onboarding.badge_before')}
        </Text>
      </View>

      {/* BADGE DESPUÉS */}
      <View className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full shadow-sm z-20">
        <Text className="text-black text-xs font-bold tracking-wide">
          {t('onboarding.badge_after')}
        </Text>
      </View>

      <Animated.View style={[styles.overlayImage, animatedStyle]}>
        <Image 
          source={require('../assets/images/onboarding-before.jpg')} 
          style={{ width: width - 48, height: 480 }} 
          resizeMode="cover"
        />
      </Animated.View>

      <Animated.View style={[styles.sliderLine, lineStyle]}>
        <View className="w-9 h-9 bg-white rounded-full items-center justify-center shadow-lg -ml-[17px] border border-gray-200">
          <View className="flex-row gap-[2px]">
            <View className="w-[2px] h-3 bg-gray-400 rounded-full" />
            <View className="w-[2px] h-3 bg-gray-400 rounded-full" />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

// --- COMPONENTE: Tarjeta de Estilo ---
const ShimmerCard = ({ image, title, delay }: { image: any, title: string, delay: number }) => {
  const translateX = useSharedValue(-200);

  useEffect(() => {
    translateX.value = withDelay(delay, withRepeat(
      withTiming(400, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    ));
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className="w-full h-40 mb-5 rounded-2xl overflow-hidden relative shadow-sm elevation-2 bg-white">
      <Image source={image} className="w-full h-full object-cover opacity-90" />
      
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
        className="absolute inset-0 justify-end pb-4 pl-5"
      >
        <Text className="text-white text-2xl font-bold tracking-wider uppercase shadow-md">{title}</Text>
      </LinearGradient>

      <Animated.View style={[styles.shimmer, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};

// --- PANTALLA PRINCIPAL ---
export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation(); 
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < 2) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/paywall');
    }
  };

  const screens = [
    // PANTALLA 1: Transformación
    {
      id: '1',
      content: (
        <View className="flex-1 px-6 pt-6 bg-white">
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text className="text-stone-900 text-4xl font-black mb-3 leading-tight">
              {t('onboarding.slide1_title')}{'\n'}
              <Text className="text-yellow-600">{t('onboarding.slide1_title_accent')}</Text>
            </Text>
            <Text className="text-gray-500 text-lg leading-6">
              {t('onboarding.slide1_text')}
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(300).duration(800)}>
            <AutoCompareSlider />
          </Animated.View>
        </View>
      ),
    },
    // PANTALLA 2: Estilos
    {
      id: '2',
      content: (
        <View className="flex-1 px-6 pt-6 bg-white">
           <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text className="text-stone-900 text-4xl font-black mb-3">
              {t('onboarding.slide2_title')} <Text className="text-yellow-600">{t('onboarding.slide2_title_accent')}</Text>
            </Text>
            <Text className="text-gray-500 text-lg mb-6 leading-6">
              {t('onboarding.slide2_text')}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <ShimmerCard 
              image={require('../assets/images/style-nordic.jpg')} 
              title={t('onboarding.style_nordic')} 
              delay={0}
            />
            <ShimmerCard 
              image={require('../assets/images/style-modern.jpg')} 
              title={t('onboarding.style_modern')} 
              delay={500}
            />
            <ShimmerCard 
              image={require('../assets/images/style-minimalist.jpg')} 
              title={t('onboarding.style_minimalist')} 
              delay={1000}
            />
          </Animated.View>
        </View>
      ),
    },
    // PANTALLA 3: Regalo
    {
      id: '3',
      content: (
        <View className="flex-1 px-6 items-center justify-center bg-white pt-10">
           <Animated.View entering={FadeInDown.springify()} className="items-center w-full">
            <Text className="text-stone-900 text-center text-4xl font-black mb-3">
              {t('onboarding.slide3_title')} <Text className="text-yellow-600">{t('onboarding.slide3_title_accent')}</Text>
            </Text>
            <Text className="text-gray-500 text-center text-lg mb-8 px-4">
              {t('onboarding.slide3_text')}
            </Text>
          </Animated.View>

          <View className="w-72 h-72 mb-8 items-center justify-center relative">
            <View className="absolute w-64 h-64 bg-yellow-100 rounded-full blur-3xl opacity-60" />
            <LottieView
              source={require('../assets/animations/gift-box.json')}
              autoPlay
              loop
              style={{ width: 300, height: 300 }}
            />
          </View>

          <View className="bg-stone-50 border border-stone-100 rounded-2xl p-5 flex-row items-center gap-4 mb-12 shadow-sm w-full">
             <View className="bg-yellow-100 p-3 rounded-full">
                <Text className="text-2xl">✨</Text>
             </View>
             <View>
                <Text className="text-stone-900 font-bold text-xl">{t('onboarding.gift_title')}</Text>
                <Text className="text-gray-500 text-base">{t('onboarding.gift_subtitle')}</Text>
             </View>
          </View>
        </View>
      ),
    },
  ];

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <FlatList
          ref={flatListRef}
          data={screens}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false} 
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ width, height: '100%' }}>
              {item.content}
            </View>
          )}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
        />

        <View className="px-6 pb-6 pt-2 bg-white">
          <View className="flex-row justify-center space-x-2 mb-6">
            {screens.map((_, index) => {
               const isActive = currentIndex === index;
               return (
                 <Animated.View 
                    key={index}
                    style={{ 
                      width: isActive ? 32 : 8, 
                      height: 8,
                      backgroundColor: isActive ? '#1c1917' : '#e5e7eb', 
                      borderRadius: 4
                    }}
                 />
               );
            })}
          </View>

          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.9}
            accessibilityRole="button"
            // --- CORREGIDO: Uso de t() ---
            accessibilityLabel={currentIndex === 2 ? t('a11y.onboarding_claim') : t('a11y.onboarding_next')}
            className="w-full rounded-2xl shadow-xl shadow-stone-200"
          >
            <LinearGradient
              colors={['#1c1917', '#292524']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-5 items-center justify-center rounded-2xl"
            >
              <Text className="text-white font-bold text-lg tracking-widest uppercase">
                {currentIndex === 2 ? t('onboarding.btn_claim') : t('onboarding.btn_next')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRightWidth: 2,
    borderRightColor: 'white',
    backgroundColor: 'white'
  },
  sliderLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 150,
    transform: [{ skewX: '-25deg' }]
  }
});