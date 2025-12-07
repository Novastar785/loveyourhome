import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  Infinity as InfinityIcon,
  Lock,
  RefreshCcw,
  Rocket,
  Trash2,
  User
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Linking, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import Purchases from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- IMPORTACIONES DE TU LÓGICA ---
import { supabase } from '../../src/config/supabase';
import { restorePurchases } from '../../src/services/revenueCat';
import { deleteAccount } from '../../src/services/user';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  // --- LÓGICA DE NEGOCIO ORIGINAL (INTACTA) ---
  const [credits, setCredits] = useState({ sub: 0, pack: 0, total: 0 });
  const [userId, setUserId] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const appUserID = await Purchases.getAppUserID(); 
      setUserId(appUserID);
      setIsSubscribed(!!customerInfo.entitlements.active['pro']);

      const { data } = await supabase
        .from('user_credits')
        .select('subscription_credits, pack_credits')
        .eq('user_id', appUserID)
        .single();

      if (data) {
        const sub = data.subscription_credits || 0;
        const pack = data.pack_credits || 0;
        setCredits({ sub, pack, total: sub + pack });
      } else {
        setCredits({ sub: 0, pack: 0, total: 0 });
      }
    } catch (e) { console.log(e); }
  };

  const handleDeleteAccount = () => {
    Alert.alert(t('profile.delete_account'), t('profile.delete_confirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteAccount(); loadData(); } }
      ]
    );
  };

  const handleRestore = async () => {
    try { await restorePurchases(); await loadData(); Alert.alert(t('store.restore_title'), t('store.restore_msg')); } catch (e) {}
  };

  const openCustomerCenter = async () => {
    try { await RevenueCatUI.presentCustomerCenter(); await loadData(); } catch (e) { Alert.alert(t('common.info'), t('profile.manage_sub_desc')); }
  };

  const openUpgradePaywall = async () => {
    try { await RevenueCatUI.presentPaywall({ displayCloseButton: true }); await loadData(); } catch (e) {}
  };

  const handleSupport = async () => {
    const email = 'sequeira.adsegom@gmail.com';
    const url = `mailto:${email}?subject=${t('profile.subject')}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) await Linking.openURL(url);
    else Alert.alert(t('common.error'), t('profile.error_mail'));
  };

  // AJUSTE VISUAL: Colores unificados al tono Taupe/Marrón cálido (#AF9883) y fondos crema (#F5F0EB)
  const subscriptionItems = [
    { icon: CreditCard, label: t('profile.manage_sub'), action: openCustomerCenter, subtitle: t('profile.manage_sub_desc'), iconColor: '#AF9883', bgIcon: 'bg-[#F5F0EB]' },
    { icon: Rocket, label: t('profile.upgrade'), action: openUpgradePaywall, subtitle: t('profile.upgrade_desc'), iconColor: '#AF9883', bgIcon: 'bg-[#F5F0EB]' },
    { icon: RefreshCcw, label: t('store.restore_title'), action: handleRestore, subtitle: t('profile.restore_desc'), iconColor: '#A8A29E', bgIcon: 'bg-[#F5F5F4]' },
  ];

  // AJUSTE VISUAL: Iconos neutros (Gris cálido) para no romper la estética limpia
  const legalItems = [
    { icon: Lock, label: t('profile.privacy'), action: () => router.push('/privacy' as any), iconColor: '#A8A29E', bgIcon: 'bg-[#F5F5F4]' },
    { icon: FileText, label: t('profile.terms'), action: () => router.push('/terms' as any), iconColor: '#A8A29E', bgIcon: 'bg-[#F5F5F4]' },
    { icon: HelpCircle, label: t('profile.support'), action: handleSupport, iconColor: '#A8A29E', bgIcon: 'bg-[#F5F5F4]' },
    { icon: Trash2, label: t('profile.delete_account'), action: handleDeleteAccount, iconColor: '#EF4444', bgIcon: 'bg-red-50' },
  ];

  return (
    // Cambiamos bg-white al color base principal para que coincida con el final del gradiente
    <View className="flex-1 bg-[#F5F5F4]">
      {/* NUEVO: Imagen de fondo en la parte superior */}
      <Image
        // Placeholder de imagen de interiorismo/arquitectura
        source={{ uri: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop' }}
        // className: posicionamiento absoluto, ocupa todo el ancho, altura de 350 unidades, y una ligera opacidad para que no sea muy agresiva
        className="absolute top-0 left-0 right-0 h-[350px] opacity-90"
        resizeMode="cover"
      />

      {/* AJUSTE VISUAL: Gradiente modificado para crear el efecto de desvanecimiento sobre la imagen */}
      <LinearGradient
        // CAMBIO CLAVE: 
        // 1. El primer color ahora es 'rgba(..., 0)' (Totalmente transparente)
        // 2. El segundo color es el sólido, pero empieza más abajo.
        colors={['rgba(250, 250, 249, 0)', '#FAFAF9', '#F5F5F4']}
        
        // CAMBIO CLAVE: locations
        // [0, 0.5, 1] significa:
        // - En el punto 0 (arriba): Es transparente (se ve la foto full).
        // - En el punto 0.5 (mitad de la pantalla): Se vuelve color crema sólido.
        // - Del 0.5 para abajo: Es todo sólido para que se lea el contenido.
        locations={[0, 0.5, 1]}
        
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="absolute inset-0"
      />
      <StatusBar barStyle="dark-content" />

      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          
          {/* HEADER PERFIL */}
          <View className="items-center mt-10 mb-8 px-6">
            <View className="relative mb-4">
              {/* AJUSTE VISUAL: Borde crema (#FFFBF7) en lugar de blanco puro para suavidad */}
              <View className="w-28 h-28 rounded-full border-4 border-[#FFFBF7] bg-white shadow-xl items-center justify-center">
                <User size={56} color="#A8A29E" />
              </View>
              
              {/* AJUSTE VISUAL: Color de suscripción Taupe (#AF9883) */}
              <View className={`absolute -bottom-3 self-center px-4 py-1.5 rounded-full border border-white flex-row items-center shadow-md ${isSubscribed ? 'bg-[#AF9883]' : 'bg-gray-800'}`}>
                {isSubscribed && <InfinityIcon size={12} color="white" strokeWidth={3} className="mr-1" />}
                <Text className="text-white text-[10px] font-bold uppercase tracking-widest">
                  {isSubscribed ? t('profile.status_premium') : t('profile.status_free')}
                </Text>
              </View>
            </View>
            
            <Text className="text-gray-900 text-xl font-bold mt-2 font-mono">
               {userId ? `ID: ${userId.substring(0, 8)}...` : "..."}
            </Text>
            
            <Text className="text-gray-500 text-sm mt-1 font-medium tracking-widest uppercase">
              {isSubscribed ? t('profile.member_pro') : t('profile.member_free')}
            </Text>
          </View>

           {/* ESTADÍSTICAS */}
           {/* AJUSTE VISUAL: Fondo crema sólido (#FFFBF7) con borde sutil (#F2EBE6) para contraste */}
           <View className="mx-6 mb-8 bg-[#FFFBF7] rounded-3xl p-4 border border-[#F2EBE6] shadow-sm">
             <View className="items-center mb-3 border-b border-gray-200/60 pb-3">
                <Text className="text-gray-400 text-[10px] uppercase tracking-widest mb-1">{t('profile.total_balance')}</Text>
                <Text className="text-4xl font-extrabold text-gray-900">{credits.total}</Text>
              </View>

              <View className="flex-row">
                <View className="flex-1 items-center border-r border-gray-200/60">
                  <Text className="text-xl font-bold text-gray-800">{credits.sub}</Text>
                  {/* AJUSTE VISUAL: Texto Taupe (#AF9883) */}
                  <Text className="text-[#AF9883] text-[10px] font-bold uppercase tracking-wider mt-1">{t('profile.plan_premium')}</Text>
                </View>

                <View className="flex-1 items-center">
                  <Text className="text-xl font-bold text-gray-800">{credits.pack}</Text>
                  {/* AJUSTE VISUAL: Texto Gris Piedra (#78716c - stone-500) */}
                  <Text className="text-[#78716c] text-[10px] font-bold uppercase tracking-wider mt-1">{t('profile.plan_standard')}</Text>
                </View>
              </View>
          </View>

          <MenuSection title={t('profile.manage_sub')} items={subscriptionItems} />
          <MenuSection title={t('profile.legal_help')} items={legalItems} />

          <View className="px-6 pb-10">
            <Text className="text-gray-400 text-[10px] text-center mt-6 uppercase tracking-widest">
              Love Your Home v1.0.0
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function MenuSection({ title, items }: { title: string, items: any[] }) {
  return (
    <View className="px-6 mb-6">
      <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 ml-2">{title}</Text>
      {/* AJUSTE VISUAL: Fondo crema sólido (#FFFBF7) y borde sutil (#F2EBE6) */}
      <View className="bg-[#FFFBF7] rounded-3xl overflow-hidden border border-[#F2EBE6] shadow-sm">
        {items.map((item, index) => (
          <TouchableOpacity 
            key={index}
            onPress={item.action}
            // AJUSTE VISUAL: Active state color crema oscuro
            className={`flex-row items-center justify-between p-4 active:bg-[#F2EBE6] ${index !== items.length - 1 ? 'border-b border-gray-100/50' : ''}`}
          >
            <View className="flex-row items-center gap-4 flex-1">
              <View className={`w-10 h-10 rounded-full items-center justify-center ${item.bgIcon}`}>
                <item.icon size={20} color={item.iconColor} />
              </View>
              <View>
                  <Text className="font-semibold text-base text-gray-900">{item.label}</Text>
                  {item.subtitle && <Text className="text-gray-500 text-xs mt-0.5">{item.subtitle}</Text>}
              </View>
            </View>
            <ChevronRight size={18} color="#A8A29E" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}