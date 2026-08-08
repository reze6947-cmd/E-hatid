// src/pages/Auth/AdminRegister.tsx
import React, { useState } from 'react';
import {
  IonButton,
  IonIcon,
  IonLoading,
} from '@ionic/react';
import { arrowBackOutline, personOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const AdminRegister: React.FC = () => {
  const history = useHistory();
  useAuth();
  useTheme();
  useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  useState(false);
  useState(false);
  const [loading] = useState(false);
  const [error] = useState('');

  return (
    <>
      <div className="sticky top-0 z-20 bg-[var(--ion-card-background)] border-b border-[var(--ion-border-color)]">
        <button
          onClick={() => history.push('/guest/home')}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--ion-color-primary)]"
        >
          <IonIcon icon={arrowBackOutline} className="text-lg" />
        </button>
      </div>


        <div style={{ maxWidth: '400px', margin: '0 auto', paddingTop: '40px', paddingBottom: '140px' }}>
          {/* Header */}
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 800, 
              color: '#DC2626',
              marginBottom: '8px',
              margin: '0 0 12px 0'
            }}>
              Admin Access
            </h1>
            <p style={{ color: 'var(--ion-text-color-secondary)', marginBottom: 0, fontSize: '15px' }}>
              Authorized personnel only
            </p>
          </div>

          {error && (
            <div style={{ 
              background: '#fee2e2', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '24px',
              color: '#991b1b',
              fontSize: '14px',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          <div style={{
            background: 'var(--ion-card-background)',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #DC2626',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <IonIcon 
              icon={personOutline} 
              style={{ fontSize: '32px', color: '#DC2626', marginBottom: '12px', display: 'block' }} 
            />
            <p style={{ margin: 0, color: 'var(--ion-text-color)', fontWeight: 600 }}>
              Admin registration is restricted.
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--ion-text-color-secondary)' }}>
              Contact your administrator to request access.
            </p>
          </div>

          <IonButton
            expand="block"
            size="large"
            className="rider-button"
            style={{
              '--background': '#DC2626',
              '--border-radius': '8px',
              height: '48px',
              fontSize: '16px',
              fontWeight: 700,
              marginBottom: '24px'
            }}
            onClick={() => history.push('/login')}
          >
            Back to Admin Login
          </IonButton>

          <div style={{ textAlign: 'center' }}>
            <span style={{ color: 'var(--ion-text-color-secondary)', fontSize: '14px' }}>
              Not an admin?{' '}
              <span 
                style={{ color: 'var(--ion-color-primary)', fontWeight: 700, cursor: 'pointer' }}
          onClick={() => history.goBack()}
              >
                Go Back
              </span>
            </span>
          </div>
        </div>

        <p style={{ textAlign: 'center', margin: '32px 0 16px', fontSize: '12px', color: 'var(--ion-text-color-secondary)' }}>
          Admin area - Authorized access only
        </p>
        <IonLoading isOpen={loading} message="Processing..." />

    </>
  );
};

export default AdminRegister;
