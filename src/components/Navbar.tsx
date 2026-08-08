import React, { useState, useEffect } from 'react';
import { IonIcon, IonButton } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { logOutOutline, arrowBackOutline, sunny, moon } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { navItemsByRole } from '../config/routesByRole';
import RoleSwitcher from './RoleSwitcher';
import OptimizedImage from './OptimizedImage';
import { subscribeAvailableOrders, subscribeRiderOrders, subscribeCustomerOrders } from '../services/orderService';

interface NavbarProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  hideMobileTabBar?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ showBack, backHref, hideMobileTabBar }) => {
  const history = useHistory();
  const location = useLocation();
  const { user, activeRole, logout } = useAuth();
  const { itemCount } = useCart();
  const { isDarkMode, toggleTheme } = useTheme();

  const isGuest = !user;
  const links = navItemsByRole[isGuest ? 'guest' : (activeRole || '')] || (user ? navItemsByRole.customer : []) || [];
  const desktopLinks = links;
  const cartCount = itemCount;
  const [riderOrderCount, setRiderOrderCount] = useState(0);
  const [customerOrderCount, setCustomerOrderCount] = useState(0);

  useEffect(() => {
    if (activeRole !== 'rider') { setRiderOrderCount(0); return; }
    let availCount = 0;
    let activeCount = 0;
    const unsub1 = subscribeAvailableOrders(orders => {
      availCount = orders.length;
      setRiderOrderCount(availCount + activeCount);
    });
    const unsub2 = user ? subscribeRiderOrders(user.id, orders => {
      activeCount = orders.filter(o => o.status !== 'delivered').length;
      setRiderOrderCount(availCount + activeCount);
    }) : () => {};
    return () => { unsub1(); unsub2(); };
  }, [activeRole, user]);

  useEffect(() => {
    if (activeRole !== 'customer' || !user) { setCustomerOrderCount(0); return; }
    const ACTIVE_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'delivering'];
    const unsub = subscribeCustomerOrders(user.id, orders => {
      setCustomerOrderCount(orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length);
    });
    return () => unsub();
  }, [activeRole, user]);

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const badgeStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    padding: '0 5px',
    borderRadius: 9,
    fontSize: 10,
    fontWeight: 700,
    lineHeight: '18px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    backgroundColor: active
      ? (isDarkMode ? 'var(--ion-card-background)' : '#FFFFFF')
      : 'var(--ion-color-primary)',
    color: active ? 'var(--ion-color-primary)' : '#FFFFFF',
    border: active ? '1.5px solid var(--ion-color-primary)' : 'none',
  });

  return (
    <>
      {/*  Top Header Bar  */}
      <header className="hidden xl:block sticky top-0 z-50 bg-[var(--ion-card-background)] border-b border-[var(--ion-border-color)]">
        <div className="flex items-center w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16">
          <div className="flex items-center gap-2 shrink-0">
            {showBack && (
              <IonButton fill="clear" onClick={() => history.push(backHref || '/')} className="-ml-1" style={{ '--padding-start': '0', '--padding-end': '0', width: '36px', height: '36px' }}>
                <IonIcon icon={arrowBackOutline} slot="icon-only" className="text-lg" />
              </IonButton>
            )}
            <OptimizedImage
              src={isDarkMode ? '/Logo/Logo-dark-mode.svg' : '/Logo/Logo-light-mode.svg'}
              alt="E-Hatid"
              width={54}
              height={54}
              priority
              className="object-contain"
            />
          </div>

          {!isGuest && (
            <div className="flex items-center justify-center flex-1 gap-3">
              {desktopLinks.map(link => (
                <IonButton
                  key={link.path}
                  fill="clear"
                  onClick={() => history.push(link.path)}
                  style={{ '--padding-start': '0', '--padding-end': '0', '--background': 'transparent', '--box-shadow': 'none', height: 'auto', minHeight: '36px' }}
                >
                  <div className={`flex items-center justify-center gap-2 px-3 lg:px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive(link.path)
                      ? 'bg-[var(--ion-color-primary)] text-white'
                      : 'text-[var(--ion-text-color-secondary)] hover:bg-[var(--ion-border-color)]/30'
                  }`}>
                    <IonIcon icon={isActive(link.path) ? link.activeIcon : link.icon} className="text-base shrink-0" />
                    <span>{link.label}</span>
                    {link.badge === 'cart' && cartCount > 0 && (
                      <span style={badgeStyle(isActive(link.path))}>
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                    {activeRole === 'rider' && link.path === '/rider/orders' && riderOrderCount > 0 && (
                      <span style={badgeStyle(isActive(link.path))}>
                        {riderOrderCount > 99 ? '99+' : riderOrderCount}
                      </span>
                    )}
                    {activeRole === 'customer' && link.path === '/customer/orders' && customerOrderCount > 0 && (
                      <span style={badgeStyle(isActive(link.path))}>
                        {customerOrderCount > 99 ? '99+' : customerOrderCount}
                      </span>
                    )}
                  </div>
                </IonButton>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 ml-auto">
            <IonButton
              fill="clear"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ '--padding-start': '0', '--padding-end': '0', width: '36px', height: '36px' }}
            >
              <IonIcon icon={isDarkMode ? sunny : moon} slot="icon-only" className={`text-lg transition-transform duration-200 ${isDarkMode ? 'text-[var(--ion-color-warning)]' : ''}`} />
            </IonButton>
            <RoleSwitcher />
            {isGuest ? (
              <IonButton shape="round" fill="solid" color="primary" onClick={() => history.push('/login')}>
                Log In
              </IonButton>
            ) : (
              <IonButton
                fill="clear"
                onClick={handleLogout}
                aria-label="Logout"
                style={{ '--padding-start': '0', '--padding-end': '0', width: '36px', height: '36px', color: '#EF4444' }}
              >
                <IonIcon icon={logOutOutline} slot="icon-only" className="text-lg" />
              </IonButton>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      {!hideMobileTabBar && links.length > 0 && (
        <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--ion-card-background)] border-t border-[var(--ion-border-color)] pb-[env(safe-area-inset-bottom,0px)] shadow-lg">
          <div className="flex items-stretch w-full h-16 px-1 gap-0.5">
            {links.map(link => {
              const active = isActive(link.path);
              const badgeCount = link.badge === 'cart'
                ? cartCount
                : link.path === '/rider/orders' && activeRole === 'rider'
                  ? riderOrderCount
                  : link.path === '/customer/orders' && activeRole === 'customer'
                    ? customerOrderCount
                    : 0;
              return (
                <IonButton
                  key={link.path}
                  fill="clear"
                  className="flex-1 min-w-0"
                  onClick={() => history.push(link.path)}
                  style={{ '--padding-start': '0', '--padding-end': '0', '--background': 'transparent', '--box-shadow': 'none', height: 'auto', minHeight: '44px' }}
                >
                  <div className={`relative flex flex-col items-center justify-center gap-0.5 w-full min-h-[40px] px-1 rounded-full transition-all duration-200 ${
                    active ? 'bg-[var(--ion-color-primary)] py-2' : 'bg-[var(--ion-border-color)]/30 py-1.5'
                  }`}>
                    <div className="relative shrink-0">
                      <IonIcon
                        icon={active ? link.activeIcon : link.icon}
                        className={`text-xl ${active ? 'text-white' : 'text-[var(--ion-text-color-secondary)]'}`}
                      />
                      {badgeCount > 0 && (
                        <span className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center border ${
                          active
                            ? 'bg-white text-[var(--ion-color-primary)] border-[var(--ion-color-primary)]'
                            : 'bg-[var(--ion-color-primary)] text-white border-white'
                        }`}>
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] xs:text-xs font-medium leading-tight truncate max-w-full ${
                      active ? 'text-white font-semibold' : 'text-[var(--ion-text-color-secondary)]'
                    }`}>
                      {link.label}
                    </span>
                  </div>
                </IonButton>
              );
            })}
          </div>
        </nav>
      )}

    </>
  );
};

export default Navbar;
