import React from 'react';
import { useTranslation } from 'react-i18next';
import WizardToolScreen, { WizardOption } from '../../components/WizardToolScreen';

export default function InteriorDesignScreen() {
  const { t } = useTranslation();

  // IDs deben coincidir con la columna 'id' en tu tabla 'ai_prompts'
  const rooms: WizardOption[] = [
    { id: 'room_living', label: t('rooms.living'), image: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=300' },
    { id: 'room_bedroom', label: t('rooms.bedroom'), image: 'https://images.unsplash.com/photo-1616594039964-40891a90bba2?w=300' },
    { id: 'room_kitchen', label: t('rooms.kitchen'), image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300' },
    { id: 'room_bathroom', label: t('rooms.bathroom'), image: 'https://images.unsplash.com/photo-1620626012053-8b9d096d29b0?w=300' },
    { id: 'room_office', label: t('rooms.office'), image: 'https://images.unsplash.com/photo-1593642532400-2682810df593?w=300' },
  ];

  const styles: WizardOption[] = [
    { id: 'style_modern', label: t('styles.modern'), image: 'https://rizzflows.com/img_aura/Image_fx(4).png' },
    { id: 'style_boho', label: t('styles.boho'), image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=300' },
    { id: 'style_minimalist', label: t('styles.minimalist'), image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=300' },
    { id: 'style_industrial', label: t('styles.industrial'), image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=300' },
    { id: 'style_luxury', label: t('styles.luxury'), image: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=300' },
  ];

  return (
    <WizardToolScreen
      featureId="interiordesign" // ID base en DB
      title={t('tools.interiordesign.title')}
      subtitle={t('tools.interiordesign.subtitle')}
      backgroundImage="https://rizzflows.com/img_aura/Image_fx(3).png"
      
      step1Title={t('wizard.step_room_title')}
      step1Options={rooms}
      
      step2Title={t('wizard.step_style_title')}
      step2Options={styles}
    />
  );
}