import React from 'react';
import { IonIcon, IonButton } from '@ionic/react';
import { closeCircleOutline, logOutOutline, swapHorizontalOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ApplicationRejected: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { user, logout } = useAuth();
  const params = new URLSearchParams(location.search);
  const role = params.get('role') || user?.activeRole || '';
  const hasOtherRoles = (user?.roles || []).filter(r => r !== role).length > 0;

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
        <IonIcon icon={closeCircleOutline} className="text-4xl text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-red-500 m-0 mb-3">Application Rejected</h1>
      <p className="text-sm text-[var(--ion-text-color-secondary)] leading-relaxed max-w-xs m-0 mb-8">
        Your <strong>{role}</strong> application was rejected. If you believe this is a mistake, please contact support.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {hasOtherRoles && (
          <IonButton shape="round" fill="outline" onClick={() => history.push('/select-role')}>
            <IonIcon icon={swapHorizontalOutline} slot="start" />
            Switch Role
          </IonButton>
        )}
        <IonButton shape="round" fill="clear" color="medium" onClick={handleLogout}>
          <IonIcon icon={logOutOutline} slot="start" />
          Sign Out
        </IonButton>
      </div>
    </div>
  );
};

export default ApplicationRejected;
