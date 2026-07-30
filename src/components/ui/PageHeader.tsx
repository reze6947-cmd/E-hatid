import React from 'react';
import { IonHeader, IonToolbar, IonTitle, IonButtons } from '@ionic/react';

interface Props {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<Props> = ({ title, subtitle, rightSlot, className = '' }) => (
  <div className={`${className}`}>
    <div className="flex items-center justify-between px-4 pt-5 pb-2">
      <div className="min-w-0 flex-1">
        <h2 className="m-0 text-2xl sm:text-[28px] font-bold text-[var(--ion-text-color)] truncate">{title}</h2>
        {subtitle && (
          <p className="m-0 mt-1 text-sm text-[var(--ion-text-color-secondary)]">{subtitle}</p>
        )}
      </div>
      {rightSlot && (
        <div className="shrink-0 ml-3">{rightSlot}</div>
      )}
    </div>
  </div>
);

export default PageHeader;
