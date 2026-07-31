import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { searchOutline } from 'ionicons/icons';

interface NoMatchStateProps {
  onReset: () => void;
}

const NoMatchState: React.FC<NoMatchStateProps> = ({ onReset }) => (
  <div className="text-center py-12 sm:py-16">
    <div className="w-14 h-14 rounded-full bg-[var(--ion-color-primary)]/10 flex items-center justify-center mx-auto mb-3">
      <IonIcon icon={searchOutline} className="text-2xl text-[var(--ion-color-primary)]" />
    </div>
    <p className="m-0 text-sm font-semibold text-[var(--ion-text-color)]">No products match your search</p>
    <p className="m-0 text-xs text-[var(--ion-text-color-secondary)] mt-1">Try a different keyword or filter.</p>
    <IonButton fill="clear" size="small" className="mt-2" onClick={onReset}>
      Clear filters
    </IonButton>
  </div>
);

export default NoMatchState;
