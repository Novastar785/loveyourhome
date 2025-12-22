import React from 'react';
import { useTranslation } from 'react-i18next';
import WizardToolScreen, { WizardOption } from '../../components/WizardToolScreen';

export default function InteriorDesignScreen() {
  const { t } = useTranslation();

  // IDs deben coincidir con la columna 'id' en tu tabla 'ai_prompts'
  const rooms: WizardOption[] = [
    { id: 'room_living', label: t('rooms.living'), image: require('../../assets/images/img_lyh/interior/living.png') },
    { id: 'room_bedroom', label: t('rooms.bedroom'), image: require('../../assets/images/img_lyh/interior/bedroom.png') },
    { id: 'room_kitchen', label: t('rooms.kitchen'), image: require('../../assets/images/img_lyh/interior/kitchen.png') },
  ];

  const styles: WizardOption[] = [
    { id: 'style_modern', label: t('styles.modern'), image: require('../../assets/images/img_lyh/interior/style-modern.jpg') },
    { id: 'style_boho', label: t('styles.boho'), image: require('../../assets/images/img_lyh/interior/style-boho.jpg') },
    { id: 'style_minimalist', label: t('styles.minimalist'), image: require('../../assets/images/img_lyh/interior/style-minimalist.jpg') },
    { id: 'style_nordic', label: t('styles.nordic'), image: require('../../assets/images/img_lyh/interior/style-nordic.jpg') },
    { id: 'style_luxury', label: t('styles.luxury'), image: require('../../assets/images/img_lyh/interior/style-luxury.jpg') },
  ];

  return (
    <WizardToolScreen
      featureId="interiordesign" // ID base en DB
      title={t('tools.interiordesign.title')}
      subtitle={t('tools.interiordesign.subtitle')}
      backgroundImage={require('../../assets/images/img_lyh/interior.jpg')}
      
      step1Title={t('wizard.step_room_title')}
      step1Options={rooms}
      
      step2Title={t('wizard.step_style_title')}
      step2Options={styles}
    />
  );
}