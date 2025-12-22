import React from 'react';
import { useTranslation } from 'react-i18next';
import WizardToolScreen, { WizardOption } from '../../components/WizardToolScreen';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';

export default function ExteriorDesignScreen() {
  const { t } = useTranslation();
  const { getCost } = useRemoteConfig();

  // PASO 1
  const houseTypes: WizardOption[] = [
    { id: 'house_modern', label: t('houses.modern_home'), image: require('../../assets/images/img_lyh/exterior/house.jpg') },
    { id: 'house_villa', label: t('houses.villa'), image: require('../../assets/images/img_lyh/exterior/villa.jpg') },
    { id: 'house_cottage', label: t('houses.cottage'), image: require('../../assets/images/img_lyh/exterior/cottage.jpg') },
  ];

  // PASO 2
  const exteriorStyles: WizardOption[] = [
    { id: 'ext_modern', label: t('styles.modern'), image: require('../../assets/images/img_lyh/exterior/style/modern.jpg') }, 
    { id: 'ext_mediterranean', label: t('styles.mediterranean'), image: require('../../assets/images/img_lyh/exterior/style/mediterranean.jpg') },
    { id: 'ext_scandinavian', label: t('styles.scandinavian'), image: require('../../assets/images/img_lyh/exterior/style/scandinavian.jpg') },
    { id: 'ext_american', label: t('styles.american'), image: require('../../assets/images/img_lyh/exterior/style/american.jpg') },
    { id: 'ext_minimalist', label: t('styles.minimalist'), image: require('../../assets/images/img_lyh/exterior/style/minimalist.jpg') },
  ];

  return (
    <WizardToolScreen
      featureId="exteriordesign"
      title={t('tools.exteriordesign.title')}
      subtitle={t('tools.exteriordesign.subtitle')}
      // Imagen de fondo para exterior
      backgroundImage={require('../../assets/images/img_lyh/exterior.jpg')}
      
      step1Title={t('wizard.step_house_title')}
      step1Options={houseTypes}
      
      step2Title={t('wizard.step_facade_title')}
      step2Options={exteriorStyles}
    />
  );
}