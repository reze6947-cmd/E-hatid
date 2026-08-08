import React from 'react';
import { IonIcon } from '@ionic/react';

interface Props {
  icon: string;
  label: string;
  value: string;
  gradientFrom: string;
  gradientTo: string;
}

const StatCard: React.FC<Props> = ({ icon, label, value, gradientFrom }) => (
  <div className="rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] p-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${gradientFrom}20` }}>
        <IonIcon icon={icon} className="text-xl" style={{ color: gradientFrom }} />
      </div>
      <div className="min-w-0">
        <p className="m-0 text-xs text-[var(--ion-text-color-secondary)]">{label}</p>
        <h4 className="m-0 mt-1 text-base sm:text-lg font-bold text-[var(--ion-text-color)] truncate">{value}</h4>
      </div>
    </div>
  </div>
);

export default StatCard;
