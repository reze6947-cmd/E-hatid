import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import BikeLoader from './BikeLoader';

const DeliveryLoader: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <IonPage>
      <IonContent>
        <div className="h-full flex items-center justify-center">
          <BikeLoader message={message} />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DeliveryLoader;
