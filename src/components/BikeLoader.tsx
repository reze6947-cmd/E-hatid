import React from 'react';
import { IonSpinner } from '@ionic/react';

const BikeLoader: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-4 px-4">
      <IonSpinner name="crescent" className="text-4xl" />
      <span className="text-sm text-[var(--ion-text-color-secondary)]">
        {message || 'Loading...'}
      </span>
    </div>
  );
};

export default BikeLoader;
