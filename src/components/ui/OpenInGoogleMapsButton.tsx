import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { navigateOutline } from 'ionicons/icons';
import { openGoogleMapsLocation } from '../../utils/geocode';

interface OpenInGoogleMapsButtonProps {
  lat?: number;
  lng?: number;
  label?: string;
  caption?: string;
  className?: string;
}

const OpenInGoogleMapsButton: React.FC<OpenInGoogleMapsButtonProps> = ({
  lat,
  lng,
  label,
  caption,
  className = '',
}) => {
  const hasLocation = (lat != null && lng != null) || Boolean(label && label.trim());
  return (
    <div className={className}>
      <IonButton
        expand="block"
        fill="outline"
        shape="round"
        className="h-11 text-sm font-semibold"
        style={{ '--border-color': 'var(--ion-color-primary)', '--color': 'var(--ion-color-primary)', margin: 0 } as React.CSSProperties}
        disabled={!hasLocation}
        onClick={() => openGoogleMapsLocation(lat, lng, label)}
      >
        <IonIcon icon={navigateOutline} slot="start" />
        Open in Google Maps
      </IonButton>
      {caption && (
        <p className="m-0 mt-2 text-xs text-[var(--ion-text-color-secondary)] text-center leading-relaxed">
          {caption}
        </p>
      )}
    </div>
  );
};

export default OpenInGoogleMapsButton;
