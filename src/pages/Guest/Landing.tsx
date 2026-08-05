import React from 'react';
import { IonIcon } from '@ionic/react';
import { restaurantOutline, storefrontOutline, bicycleOutline, chevronForwardOutline, sparklesOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const features = [
  {
    icon: restaurantOutline,
    title: 'Eat',
    copy: 'Discover the best food stalls near you and order in a few taps.',
  },
  {
    icon: storefrontOutline,
    title: 'Sell',
    copy: 'Open your own stall and reach hungry customers in your area.',
  },
  {
    icon: bicycleOutline,
    title: 'Deliver',
    copy: 'Earn as a rider delivering orders to doorsteps, faster.',
  },
];

const Landing: React.FC = () => {
  const history = useHistory();
  const { isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();

  if (isAuthenticated) {
    history.replace('/customer/home');
    return null;
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* Hero */}
      <div
        className="relative overflow-hidden px-6 pt-12 sm:pt-16 pb-10 sm:pb-14 text-center"
        style={{ background: 'var(--app-gradient-primary)' }}
      >
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 -right-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

        <div className="relative max-w-lg mx-auto">
          <img
            src={isDarkMode ? '/Logo/Logo-dark-mode.png' : '/Logo/Logo-light-mode.png'}
            alt="E-Hatid"
            className="h-16 sm:h-24 object-contain mb-6"
          />

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-4 backdrop-blur-sm">
            <IonIcon icon={sparklesOutline} className="text-sm" />
            Pin-point delivery, all over the Philippines
          </div>

          <h1 className="text-white font-extrabold text-3xl sm:text-4xl leading-tight m-0">
            Your favorite food,<br className="hidden sm:block" /> delivered right to your door.
          </h1>
          <p className="text-white/85 text-base sm:text-lg mt-3 mb-8 max-w-sm mx-auto">
            Order from the best local stalls near you. Track every delivery live.
          </p>

          <div className="w-full space-y-3">
            <button
              onClick={() => history.push('/login')}
              className="w-full h-12 bg-white text-[var(--ion-color-primary)] font-bold rounded-xl
                         transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/10"
            >
              <span className="flex items-center justify-center gap-2">
                Sign In
                <IonIcon icon={chevronForwardOutline} className="text-lg" />
              </span>
            </button>

            <button
              onClick={() => history.push('/register')}
              className="w-full h-12 border-2 border-white/60 text-white font-semibold rounded-xl bg-white/10
                         transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm"
            >
              Create Account
            </button>

            <button
              onClick={() => history.push('/guest/home')}
              className="w-full h-12 text-white font-semibold rounded-xl underline underline-offset-4
                         transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Browse as Guest
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="flex-1 px-6 py-10 sm:py-12 max-w-3xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {features.map(f => (
            <div
              key={f.title}
              className="rounded-2xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] p-5 text-center
                         transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--app-gradient-secondary)' }}>
                <IonIcon icon={f.icon} className="text-xl text-white" />
              </div>
              <h3 className="m-0 font-bold text-[var(--ion-text-color)]">{f.title}</h3>
              <p className="m-0 mt-1.5 text-sm text-[var(--ion-text-color-secondary)] leading-relaxed">{f.copy}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-[var(--ion-text-color-secondary)] mt-10">
          Made with care for Filipino communities.
        </p>
      </div>
    </div>
  );
};

export default Landing;
