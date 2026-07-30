import React from 'react';
import { IonContent } from '@ionic/react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AppFooter from '../components/AppFooter';
import { useAuth } from '../context/AuthContext';
import RiderTrackingIndicator from '../components/RiderTrackingIndicator';

const noMobileTabPaths = ['/verify-otp'];
const noNavbarPaths = ['/login', '/register', '/role-selection', '/select-role', '/apply/vendor', '/apply/rider', '/admin/register'];

const showFooterForRoles = ['customer'];

const RoleLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, activeRole } = useAuth();

  const path = location.pathname;
  const showNavbar = !noNavbarPaths.some(p => path.startsWith(p));
  const hideMobileTab = noMobileTabPaths.some(p => path.startsWith(p));
  const showFooter = showFooterForRoles.some(r => path.startsWith(`/${r}/`));
  const isRider = activeRole === 'rider' || path.startsWith('/rider/');

  return (
    <>
      {showNavbar && <Navbar hideMobileTabBar={hideMobileTab} />}

      <IonContent>
        <div className="min-h-full flex flex-col">
          <div className="w-full mx-auto px-4 md:px-6 lg:px-8 flex-1 pt-4 pb-24 md:pb-0 max-w-xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl">
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