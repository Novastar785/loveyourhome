import React from 'react';
import { useTranslation } from 'react-i18next'; 
import TryOnToolScreen from '../../components/TryOnToolScreen';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';

export default function StyleTransferScreen() {
  const { t } = useTranslation();
  const { getCost } = useRemoteConfig(); 

  return (
    <TryOnToolScreen 
      title={t('tools.styletransfer.title')} 
      subtitle={t('feature_descriptions.styletransfer')}
      price={getCost('styletransfer', 3)} 
      backgroundImage="https://rizzflows.com/img_aura/Vtryon.png" // O una imagen de interior
      apiMode="styletransfer" // <--- Importante para la DB
      isInteriorMode={true}   // <--- Activa los iconos de Casa/Estilo
    />
  );
}