import React from 'react';
import { useTranslation } from 'react-i18next';
import SingleStepDesignScreen, { DesignOption } from '../../components/SingleStepDesignScreen';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';

export default function GardenDesignScreen() {
  const { t } = useTranslation();
  const { getCost } = useRemoteConfig();

  // Opciones de Estilo para el Jardín
  const gardenStyles: DesignOption[] = [
    { 
      id: 'garden_zen', 
      label: t('styles.zen'), 
      image: 'https://images.unsplash.com/photo-1590483005691-36dc30d1b0f4?w=300' 
    },
    { 
      id: 'garden_tropical', 
      label: t('styles.tropical'), 
      image: 'https://images.unsplash.com/photo-1574315042633-999fa5b07222?w=300' 
    },
    { 
      id: 'garden_modern', 
      label: t('styles.modern'), 
      image: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=300' 
    },
    { 
      id: 'garden_english', 
      label: t('styles.english'), 
      image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=300' 
    },
    { 
      id: 'garden_mediterranean', 
      label: t('styles.mediterranean'), 
      image: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=300' 
    },
  ];

  return (
    <SingleStepDesignScreen
      featureId="gardendesign"
      title={t('tools.gardendesign.title')}
      subtitle={t('tools.gardendesign.subtitle')}
      price={getCost('gardendesign', 3)}
      // Esta es la misma imagen que usas en el Home para la tarjeta de Garden Design
      backgroundImage="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800"
      options={gardenStyles}
      selectionTitle={t('wizard.step_style_title')}
    />
  );
}