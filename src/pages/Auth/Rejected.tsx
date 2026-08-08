import React from 'react';
import { IonIcon } from '@ionic/react';
import { closeCircleOutline, logOutOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Rejected: React.FC = () => {
  const history = useHistory();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', textAlign: 'center' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#EF444420', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
        <IonIcon icon={closeCircleOutline} style={{ fontSize: '40px', color: '#EF4444' }} />
      </div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#EF4444', margin: '0 0 12px' }}>Application Rejected</h1>
      <p style={{ color: 'var(--ion-text-color-secondary)', fontSize: '14px', lineHeight: 1.6, maxWidth: '360px', margin: '0 0 32px' }}>
        Your application to join as <strong>{user?.activeRole}</strong> has been rejected.
        If you believe this is a mistake, please contact support.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '300px' }}>
        <button onClick={handleLogout}
          style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: 'var(--ion-color-primary)', color: 'white', fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <IonIcon icon={logOutOutline} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Rejected;
