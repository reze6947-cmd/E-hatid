import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { logOutOutline, arrowBackOutline, sunny, moon } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { navItemsByRole } from '../config/routesByRole';
import RoleSwitcher from './RoleSwitcher';
import { subscribeAvailableOrders, subscribeRiderOrders, subscribeCustomerOrders } from '../services/orderService';

interface NavbarProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  hideMobileTabBar?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ title, showBack, backHref, hideMobileTabBar }) => {
  const history = useHistory();
  const location = useLocation();
  const { user, activeRole, logout } = useAuth();
  const { itemCount } = useCart();
  const { isDarkMode, toggleTheme } = useTheme();

  const isGuest = !user;
  const links = isGuest ? [] : (navItemsByRole[activeRole || ''] || []);
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
      <header className="hidden md:block sticky top-0 z-50 bg-[var(--ion-card-background)] border-b border-[var(--ion-border-color)]">
        <div className="flex items-center w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16">
          <div className="flex items-center gap-2 shrink-0">
            {showBack && (
              <button onClick={() => history.push(backHref || '/')} className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--ion-color-primary)] hover:bg-[var(--ion-border-color)]/30 transition-colors -ml-1">
                <IonIcon icon={arrowBackOutline} className="text-lg" />
              </button>
            )}
            <img
              src={isDarkMode ? '/Logo/Logo-dark-mode.png' : '/Logo/Logo-light-mode.png'}
              alt="E-Hatid"
              style={{ width: 54, height: 54 }}
              className="object-contain"
            />
          </div>

          {!isGuest && (
            <div className="flex items-center justify-center flex-1 gap-3">
              {desktopLinks.map(link => (
                <button
                  key={link.path}
                  onClick={() => history.push(link.path)}
                  className="flex items-center justify-center min-h-[36px]"
                >
                  <div className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
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
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--ion-text-color-secondary)] hover:bg-[var(--ion-border-color)]/30 transition-colors"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <IonIcon icon={isDarkMode ? sunny : moon} className={`text-lg transition-transform duration-200 ${isDarkMode ? 'text-[var(--ion-color-warning)]' : ''}`} />
            </button>
            <RoleSwitcher />
            {isGuest ? (
              <button onClick={() => history.push('/login')} className="h-9 px-4 rounded-lg bg-[var(--ion-color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                Log In
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                aria-label="Logout"
              >
                <IonIcon icon={logOutOutline} className="text-lg" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      {!isGuest && !hideMobileTabBar && links.length > 0 && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--ion-card-background)] border-t border-[var(--ion-border-color)] safe-area-bottom shadow-lg">
          <div className="flex items-center justify-center h-16 px-2 gap-1">
            {links.map(link => {
              const active = isActive(link.path);
              return (
                <button
                  key={link.path}
                  onClick={() => history.push(link.path)}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 max-w-[80px] min-h-[44px] rounded-full transition-all duration-200 ${
                    active ? 'bg-[var(--ion-color-primary)] px-4 py-2' : 'bg-[var(--ion-border-color)]/30 px-3 py-1.5'
                  }`}
                >
                  <div className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                    <IonIcon
                      icon={active ? link.activeIcon : link.icon}
                      className={`text-xl ${active ? 'text-white' : 'text-[var(--ion-text-color-secondary)]'}`}
                    />
                  </div>
                  <span className={`text-xs font-medium leading-tight ${
                    active ? 'text-white font-semibold' : 'text-[var(--ion-text-color-secondary)]'
                  }`}>
                    {link.label}
                    {link.badge === 'cart' && cartCount > 0 && (
                      <span style={badgeStyle(active)}>
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                    {activeRole === 'rider' && link.path === '/rider/orders' && riderOrderCount > 0 && (
                      <span style={badgeStyle(active)}>
                        {riderOrderCount > 99 ? '99+' : riderOrderCount}
                      </span>
                    )}
                    {activeRole === 'customer' && link.path === '/customer/orders' && customerOrderCount > 0 && (
                      <span style={badgeStyle(active)}>
                        {customerOrderCount > 99 ? '99+' : customerOrderCount}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

    </>
  );
};

export default Navbar;
