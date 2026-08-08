// src/components/LogoHeader.tsx
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import OptimizedImage from './OptimizedImage';

interface LogoHeaderProps {
  onClick?: () => void;
}

const LogoHeader: React.FC<LogoHeaderProps> = ({ onClick }) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className="flex items-center justify-center px-3 sm:px-4 py-4 sm:py-6 md:py-8 cursor-pointer transition-opacity hover:opacity-80"
      onClick={onClick}
    >
      <OptimizedImage
        src={isDarkMode ? '/Logo/Logo-dark-mode.svg' : '/Logo/Logo-light-mode.svg'}
        alt="E-Hatid"
        width={160}
        height={40}
        priority
        className="h-10 sm:h-14 object-contain"
      />
    </div>
  );
};

export default LogoHeader;