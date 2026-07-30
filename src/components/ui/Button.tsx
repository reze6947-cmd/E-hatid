import React from 'react';
import { IonButton } from '@ionic/react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
}

const sizeMap: Record<string, 'small' | 'default' | 'large'> = {
  sm: 'small',
  md: 'default',
  lg: 'large',
};

const variantMap: Record<string, { color: string; fill: 'solid' | 'outline' | 'clear' }> = {
  primary: { color: 'primary', fill: 'solid' },
  secondary: { color: 'medium', fill: 'solid' },
  ghost: { color: 'primary', fill: 'clear' },
  danger: { color: 'danger', fill: 'solid' },
};

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  fullWidth = false,
}) => {
  const config = variantMap[variant];
  return (
    <IonButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      fill={config.fill}
      color={config.color}
      size={sizeMap[size]}
      expand={fullWidth ? 'block' : undefined}
      shape="round"
      className={`font-semibold min-h-[44px] ${className}`}
      style={{ '--box-shadow': 'none' } as React.CSSProperties}
    >
      {children}
    </IonButton>
  );
};

export default Button;
