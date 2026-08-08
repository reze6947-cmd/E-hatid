import React from 'react';
import { IonIcon } from '@ionic/react';
import { logoFacebook, logoTwitter, logoInstagram } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import OptimizedImage from './OptimizedImage';

const quickLinks = [
  { label: 'Home', path: '/guest/home' },
  { label: 'Browse Stalls', path: '/guest/home' },
  { label: 'Apply as a Vendor', path: '/apply/vendor' },
  { label: 'Apply as a Rider', path: '/apply/rider' },
  { label: 'Help & FAQ', path: '/help' },
  { label: 'Blog', path: '/blog' },
];

const socialLinks = [
  { icon: logoFacebook, href: 'https://facebook.com', label: 'Facebook' },
  { icon: logoTwitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: logoInstagram, href: 'https://instagram.com', label: 'Instagram' },
];

const AppFooter: React.FC = () => {
  const history = useHistory();
  const { isDarkMode } = useTheme();

  return (
    <footer className="hidden md:block bg-[var(--ion-card-background)] border-t border-[var(--ion-border-color)] py-8 sm:py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 mb-8 sm:mb-10">
          {/* Brand */}
          <div className="space-y-3 sm:space-y-4">
            <OptimizedImage
              src={isDarkMode ? '/Logo/Logo-dark-mode.svg' : '/Logo/Logo-light-mode.svg'}
              alt="E-Hatid"
              width={160}
              height={40}
              className="h-10 sm:h-14 object-contain"
            />
            <p className="text-xs sm:text-sm text-[var(--ion-text-color-secondary)] leading-relaxed max-w-xs">
              Your favorite food, delivered fast. Order from the best local restaurants and stalls near you.
            </p>
            <div className="flex gap-2 pt-1">
              {socialLinks.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-9 h-9 rounded-lg bg-[var(--ion-color-light)] hover:bg-[var(--ion-color-primary)]/10 hover:text-[var(--ion-color-primary)] transition-colors flex items-center justify-center text-[var(--ion-text-color-secondary)]"
                >
                  <IonIcon icon={social.icon} className="text-lg" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-[var(--ion-text-color)]">Quick Links</h3>
            <ul className="space-y-2 sm:space-y-2.5">
              {quickLinks.map(link => (
                <li key={link.label}>
                  <button
                    onClick={() => history.push(link.path)}
                    className="text-xs sm:text-sm text-[var(--ion-text-color-secondary)] hover:text-[var(--ion-color-primary)] transition-colors min-h-[36px] text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--ion-border-color)] pt-5 sm:pt-6">
          <span className="text-[10px] sm:text-xs text-[var(--ion-text-color-secondary)] block text-center">
            &copy; {new Date().getFullYear()} E-Hatid. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
