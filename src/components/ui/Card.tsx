import React from 'react';
import { IonCard, IonCardContent } from '@ionic/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverable }) => (
  <IonCard
    onClick={onClick}
    className={`
      ${hoverable || onClick ? 'cursor-pointer' : ''}
      ${className}
    `}
    style={{
      margin: 0,
      '--border-radius': '16px',
      '--box-shadow': 'none',
      border: '1px solid var(--ion-border-color)',
      background: 'var(--ion-card-background)',
    } as React.CSSProperties}
  >
    <IonCardContent style={{ padding: 0 }}>
      <div className="p-4 md:p-6">{children}</div>
    </IonCardContent>
  </IonCard>
);

export default Card;
