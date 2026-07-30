import React from 'react';
import { IonSegment, IonSegmentButton, IonLabel } from '@ionic/react';

interface Tab {
  value: string;
  label: string;
  count?: number;
}

interface Props {
  tabs: Tab[];
  selected: string;
  onChange: (value: string) => void;
}

const countBadge = (count: number, color: string) => (
  <span
    className="shrink-0 text-xs font-bold"
    style={{
      backgroundColor: '#FFFFFF',
      color,
      minWidth: 22,
      height: 22,
      lineHeight: '22px',
      padding: '0 6px',
      borderRadius: 11,
      textAlign: 'center',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      border: `1.5px solid ${color}`,
    }}
  >
    {count > 99 ? '99+' : count}
  </span>
);

const SegmentTabs: React.FC<Props> = ({ tabs, selected, onChange }) => (
  <div className="px-4 pb-1">
    <IonSegment
      value={selected}
      onIonChange={e => onChange(e.detail.value as string)}
      style={{ '--background': 'var(--ion-border-color)' }}
    >
      {tabs.map(tab => (
        <IonSegmentButton
          key={tab.value}
          value={tab.value}
          style={{ '--color-checked': '#FFFFFF', '--border-radius': '8px', '--indicator-color': 'var(--ion-color-primary)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IonLabel>{tab.label}</IonLabel>
            {tab.count != null && tab.count > 0 && (
              countBadge(
                tab.count,
                tab.value === 'available' ? '#EF4444' :
                tab.value === 'active' ? '#6D28D9' :
                '#10B981'
              )
            )}
          </div>
        </IonSegmentButton>
      ))}
    </IonSegment>
  </div>
);

export default SegmentTabs;
