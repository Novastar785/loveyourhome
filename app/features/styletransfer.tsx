import React from 'react';
import { useTranslation } from 'react-i18next';
import DualImageToolScreen from '../../components/DualImageToolScreen'; 
import { useRemoteConfig } from '../../hooks/useRemoteConfig';

export default function StyleTransferScreen() {
  const { t } = useTranslation();
  const { getCost } = useRemoteConfig();

  return (
    <DualImageToolScreen 
      featureId="styletransfer" 
      title={t('tools.styletransfer.title')}
      subtitle={t('tools.styletransfer.subtitle')}
      price={getCost('styletransfer', 3)} 
      // Usando imagen local
      backgroundImage={require('../../assets/images/img_lyh/transfer.jpg')}
      label1={t('styletransfer_tool.user_photo')} 
      label2={t('styletransfer_tool.outfit_photo')} 
    />
  );
}