import React from 'react';
import { useTranslation } from 'react-i18next';
import SingleStepDesignScreen, { DesignOption } from '../../components/SingleStepDesignScreen';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';

export default function GardenDesignScreen() {
  const { t } = useTranslation();
  const { getCost } = useRemoteConfig();

  // Opciones de Estilo para el Jardín con imágenes locales
  const gardenStyles: DesignOption[] = [
    { 
      id: 'garden_zen', 
      label: t('styles.zen'), 
      image: require('../../assets/images/img_lyh/garden/zen.jpg')
    },
    { 
      id: 'garden_tropical', 
      label: t('styles.tropical'), 
      image: require('../../assets/images/img_lyh/garden/tropical.jpg')
    },
    { 
      id: 'garden_modern', 
      label: t('styles.modern'), 
      image: require('../../assets/images/img_lyh/garden/moderm.jpg')
    },
    { 
      id: 'garden_english', 
      label: t('styles.english'), 
      image: require('../../assets/images/img_lyh/garden/english.jpg')
    },
    { 
      id: 'garden_mediterranean', 
      label: t('styles.mediterranean'), 
      image: require('../../assets/images/img_lyh/garden/mediterranean.jpg')
    },
  ];

  return (
    <SingleStepDesignScreen
      featureId="gardendesign"
      title={t('tools.gardendesign.title')}
      subtitle={t('tools.gardendesign.subtitle')}
      price={getCost('gardendesign', 3)}
      // Usando imagen local
      backgroundImage={require('../../assets/images/img_lyh/jardin.jpg')}
      options={gardenStyles}
      selectionTitle={t('wizard.step_style_title')}
    />
  );
}