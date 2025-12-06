import React from 'react';
import { useTranslation } from 'react-i18next';
import WizardToolScreen, { WizardOption } from '../../components/WizardToolScreen';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';

export default function ExteriorDesignScreen() {
  const { t } = useTranslation();
  const { getCost } = useRemoteConfig();

  // PASO 1: Tipo de Casa (Contexto Estructural)
  const houseTypes: WizardOption[] = [
    { 
      id: 'house_modern', 
      label: t('houses.modern_home'), 
      image: 'https://images.unsplash.com/photo-1600596542815-27b5c0b8aa09?w=300' 
    },
    { 
      id: 'house_villa', 
      label: t('houses.villa'), 
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=300' 
    },
    { 
      id: 'house_cottage', 
      label: t('houses.cottage'), 
      image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=300' 
    },
    { 
      id: 'house_bungalow', 
      label: t('houses.bungalow'), 
      image: 'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=300' 
    },
    { 
      id: 'house_mansion', 
      label: t('houses.mansion'), 
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300' 
    },
  ];

  // PASO 2: Estilo de Fachada (Visual)
  const exteriorStyles: WizardOption[] = [
    { 
      id: 'ext_modern', 
      label: t('styles.modern'), 
      image: 'https://rizzflows.com/img_aura/Image_fx(4).png' 
    },
    { 
      id: 'ext_mediterranean', 
      label: t('styles.mediterranean'), 
      image: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=300' 
    },
    { 
      id: 'ext_scandinavian', 
      label: t('styles.scandinavian'), 
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=300' 
    },
    { 
      id: 'ext_farmhouse', 
      label: t('styles.farmhouse'), 
      image: 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=300' 
    },
    { 
      id: 'ext_industrial', 
      label: t('styles.industrial'), 
      image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=300' 
    },
  ];

  return (
    <WizardToolScreen
      featureId="exteriordesign" // ID base para la DB
      title={t('tools.exteriordesign.title')}
      subtitle={t('tools.exteriordesign.subtitle')}
      // Usa una imagen de fondo apropiada para exteriores
      backgroundImage="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"
      
      step1Title={t('wizard.step_house_title')}
      step1Options={houseTypes}
      
      step2Title={t('wizard.step_facade_title')}
      step2Options={exteriorStyles}
    />
  );
}