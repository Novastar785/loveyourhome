import { useRouter } from 'expo-router';
import { ArrowLeft, Lock } from 'lucide-react-native';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Trans, useTranslation } from 'react-i18next';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-white">
      {/* Fondo Gradiente Consistente */}
      <LinearGradient
        colors={['#EEF2FF', '#ffffff', '#F5F3FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <SafeAreaView edges={['top']} className="px-6 pb-4 z-10">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-200 shadow-sm"
          >
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <Text className="text-gray-900 text-xl font-bold">{t('legal.privacy_title')}</Text>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        <View className="items-center mb-8">
          <View className="w-16 h-16 bg-emerald-100 rounded-full items-center justify-center mb-4 border border-emerald-200">
            <Lock size={32} color="#10b981" />
          </View>
          <Text className="text-gray-500 text-xs uppercase tracking-widest">{t('legal.data_secure')}</Text>
          <Text className="text-gray-400 text-[10px] mt-1">{t('legal.last_updated')}</Text>
        </View>

        <View className="gap-6">
          <Text className="text-gray-600 leading-6 text-base">
            <Trans 
              i18nKey="legal.privacy.intro" 
              values={{ appName: t('legal.app_name'), companyName: t('legal.company_name') }}
              components={{ bold: <Text className="font-bold text-gray-900" /> }} 
            />
          </Text>

          <Section title={t('legal.privacy.section_1_title')}>
            <Text className="font-bold text-indigo-600">{t('legal.privacy.section_1_a')}</Text>
            {(t('legal.privacy.section_1_a_list', { returnObjects: true }) as string[]).map((item, i) => (
              <Text key={`a-${i}`}>{'\n'}• {item}</Text>
            ))}
            {'\n\n'}
            <Text className="font-bold text-indigo-600">{t('legal.privacy.section_1_b')}</Text>
            {(t('legal.privacy.section_1_b_list', { returnObjects: true }) as string[]).map((item, i) => (
              <Text key={`b-${i}`}>{'\n'}• {item}</Text>
            ))}
          </Section>

          {/* ... resto de secciones iguales, el componente Section se encarga del estilo ... */}
          
          <Section title={t('legal.privacy.section_2_title')}>
            {(t('legal.privacy.section_2_list', { returnObjects: true }) as string[]).map((item, i) => (
              <Text key={i}>{'\n'}• {item}</Text>
            ))}
          </Section>

          <Section title={t('legal.privacy.section_3_title')}>
            {t('legal.privacy.section_3_text')}
          </Section>

          <Section title={t('legal.privacy.section_4_title')}>
            {(t('legal.privacy.section_4_list', { returnObjects: true }) as string[]).map((item, i) => (
              <Text key={i}>{'\n'}• {item}</Text>
            ))}
          </Section>

          <Section title={t('legal.privacy.section_5_title')}>
            {t('legal.privacy.section_5_text')}
          </Section>

          <Section title={t('legal.privacy.section_6_title')}>
            {t('legal.privacy.section_6_text')}
          </Section>

          <Section title={t('legal.privacy.section_7_title')}>
            {t('legal.privacy.section_7_text')}
          </Section>

          <Section title={t('legal.privacy.section_8_title')}>
            {t('legal.privacy.section_8_text')}
          </Section>

          <Section title={t('legal.privacy.section_9_title')}>
            <Text className="font-bold text-gray-900">Email:</Text> {t('legal.contact_email')}
            {'\n'}<Text className="font-bold text-gray-900">Company:</Text> {t('legal.company_name')}
          </Section>
        </View>

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <View>
      <Text className="text-gray-900 text-lg font-bold mb-2">{title}</Text>
      <Text className="text-gray-600 leading-6 text-base">{children}</Text>
    </View>
  );
}