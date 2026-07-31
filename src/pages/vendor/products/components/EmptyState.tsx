import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { addOutline, restaurantOutline } from 'ionicons/icons';

interface EmptyStateProps {
  onAdd: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAdd }) => (
  <div className="rounded-2xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] shadow-sm px-6 py-12 sm:py-16 text-center">
    <div className="w-16 h-16 rounded-full bg-[var(--ion-color-primary)]/10 flex items-center justify-center mx-auto mb-4">
      <IonIcon icon={restaurantOutline} className="text-3xl text-[var(--ion-color-primary)]" />
    </div>
    <h3 className="m-0 text-base sm:text-lg font-bold text-[var(--ion-text-color)]">No products yet</h3>
    <p className="m-0 text-sm text-[var(--ion-text-color-secondary)] mt-1.5 max-w-sm mx-auto">Add your first menu item to start accepting orders.</p>
    <IonButton className="mt-5 min-h-[44px] font-semibold" shape="round" onClick={onAdd}>
      <IonIcon icon={addOutline} slot="start" />
      Add your first product
    </IonButton>
  </div>
);

export default EmptyState;
