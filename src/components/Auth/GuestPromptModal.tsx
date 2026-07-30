// src/components/Auth/GuestPromptModal.tsx
import React from 'react';
import {
  IonModal,
  IonContent,
  IonButton,
  IonIcon,
  IonText,
  IonHeader,
  IonToolbar,
} from '@ionic/react';
import { personAddOutline, logInOutline, closeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

interface GuestPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
}

const GuestPromptModal: React.FC<GuestPromptModalProps> = ({ isOpen, onClose, onContinue }) => {
  const history = useHistory();
  const { isDarkMode } = useTheme();

  const handleRegister = () => {
    onClose();
    history.push('/register');
  };

  const handleLogin = () => {
    onClose();
    history.push('/login');
  };

  return (
    <IonModal 
      isOpen={isOpen} 
      onDidDismiss={onClose}
      className="guest-prompt-modal"
      breakpoints={[0, 0.4]}
      initialBreakpoint={0.4}
    >
      <IonContent 
        className="ion-padding"
        style={{ '--background': 'var(--ion-card-background)' } as any}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div 
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}
          >
            <IonIcon icon={personAddOutline} style={{ fontSize: '40px', color: 'white' }} />
          </div>
          
          <IonText>
            <h2 style={{ margin: '0 0 10px', fontWeight: 700, color: 'var(--ion-text-color)' }}>
              Almost there! 🎉
            </h2>
            <p style={{ margin: '0 0 30px', color: 'var(--ion-text-color-secondary)', lineHeight: 1.6 }}>
              Create an account or login to complete your order and enjoy exclusive deals!
            </p>
          </IonText>

          <IonButton
            expand="block"
            className="rider-button"
            style={{ 
              '--background': 'var(--ion-color-primary)',
              marginBottom: '12px',
              height: '50px',
              fontSize: '16px'
            }}
            onClick={handleRegister}
          >
            <IonIcon slot="start" icon={personAddOutline} />
            Register Now
          </IonButton>

          <IonButton
            expand="block"
            fill="outline"
            className="rider-button"
            style={{ 
              '--border-color': 'var(--ion-color-primary)',
              '--color': 'var(--ion-color-primary)',
              marginBottom: '12px',
              height: '50px',
              fontSize: '16px'
            }}
            onClick={handleLogin}
          >
            <IonIcon slot="start" icon={logInOutline} />
            Login
          </IonButton>

          <IonButton
            fill="clear"
            style={{ '--color': 'var(--ion-text-color-secondary)' }}
            onClick={onClose}
          >
            Continue Browsing
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default GuestPromptModal;