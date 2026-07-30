import React from 'react';
import { IonBadge } from '@ionic/react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const colorMap: Record<string, string> = {
  success: 'success',
  warning: 'warning',
  error: 'danger',
  info: 'primary',
};

const Badge: React.FC<BadgeProps> = ({ children, variant = 'info', className = '' }) => (
  <IonBadge color={colorMap[variant]} className={`text-xs font-semibold ${className}`}>
    {children}
  </IonBadge>
);

export default Badge;
