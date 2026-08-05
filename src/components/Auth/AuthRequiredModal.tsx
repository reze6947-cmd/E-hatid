import React from 'react';
import { IonModal, IonButton, IonIcon } from '@ionic/react';
import { personAddOutline, logInOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({ isOpen, onClose }) => {
  const history = useHistory();

  const goTo = (path: string) => {
    onClose();
    history.push(path);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <div
        style={{
          padding: '32px 24px',
          textAlign: 'center',
          background: 'var(--ion-card-background)',
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'var(--ion-color-primary)',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IonIcon icon={personAddOutline} style={{ fontSize: '36px', color: '#fff' }} />
        </div>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--ion-text-color)' }}>
          Create an account to check out
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--ion-text-color-secondary)', lineHeight: 1.5 }}>
          You can keep browsing and adding to your cart, but you'll need an account to place your order.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
          <IonButton
            expand="block"
            size="large"
            style={{ '--background': 'var(--ion-color-primary)', '--border-radius': '8px', height: '48px', fontSize: '15px', fontWeight: 600 }}
            onClick={() => goTo('/register')}
          >
            <IonIcon slot="start" icon={personAddOutline} />
            Create Account
          </IonButton>
          <IonButton
            expand="block"
            size="large"
            fill="outline"
            style={{ '--border-color': 'var(--ion-color-primary)', '--color': 'var(--ion-color-primary)', '--border-radius': '8px', height: '48px', fontSize: '15px', fontWeight: 600 }}
            onClick={() => goTo('/login')}
          >
            <IonIcon slot="start" icon={logInOutline} />
            Log In
          </IonButton>
        </div>
        <IonButton
          fill="clear"
          style={{ marginTop: '8px', '--color': 'var(--ion-text-color-secondary)' }}
          onClick={onClose}
        >
          Maybe Later
        </IonButton>
      </div>
    </IonModal>
  );
};

export default AuthRequiredModal;
