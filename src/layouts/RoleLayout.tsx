import React from 'react';
import { IonContent, IonRefresher, IonRefresherContent } from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { chevronDownOutline } from 'ionicons/icons';
import Navbar from '../components/Navbar';
import AppFooter from '../components/AppFooter';
import Seo from '../components/Seo';
import { useAuth } from '../context/AuthContext';
import RiderTrackingIndicator from '../components/RiderTrackingIndicator';
import { runRefreshHandler } from '../utils/refreshBus';

const noMobileTabPaths = ['/verify-otp'];
const noNavbarPaths = ['/login', '/register', '/role-selection', '/select-role', '/apply/vendor', '/apply/rider', '/admin/register'];
const privatePrefixes = ['/customer', '/rider', '/vendor', '/admin', '/login', '/register', '/select-role', '/verify-otp', '/apply', '/approval-pending', '/application-rejected', '/guest/cart', '/guest/location'];
const showFooterForRoles = ['customer', 'stall'];

const RoleLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, activeRole } = useAuth();

  const path = location.pathname;
  const showNavbar = !noNavbarPaths.some(p => path.startsWith(p));
  const hideMobileTab = noMobileTabPaths.some(p => path.startsWith(p));
  const showFooter = showFooterForRoles.some(r => path.startsWith(`/${r}/`));
  const isRider = activeRole === 'rider' || path.startsWith('/rider/');
  const isPrivate = privatePrefixes.some(p => path.startsWith(p));

  return (
    <>
      {isPrivate && (
        <Seo title="E-Hatid" description="E-Hatid — food delivery in the Philippines." noindex />
      )}
      {showNavbar && <Navbar hideMobileTabBar={hideMobileTab} />}

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={async (e) => { await runRefreshHandler(); e.detail.complete(); }}>
          <IonRefresherContent pullingIcon={chevronDownOutline} refreshingSpinner="crescent" />
        </IonRefresher>
        <div className="min-h-full flex flex-col">
          <div className="w-full mx-auto px-4 md:px-6 lg:px-8 flex-1 pt-4 pb-24 xl:pb-0 max-w-7xl">
            {children}
          </div>
          {showFooter && <AppFooter />}
        </div>
      </IonContent>

      {isRider && <RiderTrackingIndicator userId={user?.id} />}
    </>
  );
};

export default RoleLayout;