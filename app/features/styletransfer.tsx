import React from 'react';
import { useTranslation } from 'react-i18next';
import DualImageToolScreen from '../../components/DualImageToolScreen'; // Usamos el nuevo componente
import { useRemoteConfig } from '../../hooks/useRemoteConfig';

export default function StyleTransferScreen() {
  const { t } = useTranslation();
  const { getCost } = useRemoteConfig();

  return (
    <DualImageToolScreen 
      featureId="styletransfer" // ID en DB
      title={t('tools.styletransfer.title')}
      subtitle={t('tools.styletransfer.subtitle')}
      price={getCost('styletransfer', 3)} 
      backgroundImage="https://rizzflows.com/img_aura/Vtryon.png"
      label1={t('styletransfer_tool.user_photo')} // "Tu Foto"
      label2={t('styletransfer_tool.outfit_photo')} // "Foto de Estilo" (Reusa la key o crea una nueva)
    />
  );
}