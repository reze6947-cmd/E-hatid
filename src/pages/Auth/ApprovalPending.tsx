import React, { useEffect } from 'react';
import { IonIcon, IonButton } from '@ionic/react';
import { timeOutline, logOutOutline, swapHorizontalOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ApprovalPending: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { user, logout } = useAuth();
  const params = new URLSearchParams(location.search);
  const role = params.get('role') || user?.activeRole || '';
  const hasOtherRoles = (user?.roles || []).filter(r => r !== role).length > 0;

  useEffect(() => {
    if (!role || !user) return;
    if (user.roleStatus?.[role] === 'approved') {
      const dashboards: Record<string, string> = {
        vendor: '/vendor/dashboard',
        rider: '/rider/dashboard',
      };
      if (dashboards[role]) history.replace(dashboards[role]);
    }
  }, [role, user, history]);

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-[var(--ion-color-warning)]/20 flex items-center justify-center mb-6">
        <IonIcon icon={timeOutline} className="text-4xl text-[var(--ion-color-warning)]" />
      </div>
      <h1 className="text-2xl font-bold text-[var(--ion-text-color)] m-0 mb-3">Application Submitted</h1>
      <p className="text-sm text-[var(--ion-text-color-secondary)] leading-relaxed max-w-xs m-0 mb-8">
        Your <strong>{role}</strong> application is under review. You will be notified once approved.
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

export default ApprovalPending;
