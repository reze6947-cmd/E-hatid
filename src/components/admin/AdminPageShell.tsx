import React from 'react';
import { IonSearchbar } from '@ionic/react';

interface AdminPageShellProps {
  title: string;
  subtitle?: string;
  search?: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  };
  loading?: boolean;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
}

const AdminPageShell: React.FC<AdminPageShellProps> = ({
  title, subtitle, search, loading, skeleton, children
}) => (
  <div className="w-full flex-1 md:pt-8 pb-10 flex flex-col space-y-3 sm:space-y-4">
    <div className="mb-1">
      <h1 className="m-0 text-xl xs:text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--ion-text-color)]">
        {title}
      </h1>
      {subtitle && (
        <p className="m-0 mt-1 sm:mt-2 text-sm xs:text-base sm:text-lg text-[var(--ion-text-color-secondary)]">
          {subtitle}
        </p>
      )}
      {search && (
        <IonSearchbar
          value={search.value}
          onIonChange={e => search.onChange(e.detail.value!)}
          placeholder={search.placeholder || 'Search...'}
          style={{
            '--background': 'var(--ion-card-background)',
            '--border-radius': '12px',
            '--border': '1px solid var(--ion-border-color)',
            '--placeholder-color': 'var(--ion-text-color-secondary)',
            '--icon-color': 'var(--ion-color-primary)',
            '--color': 'var(--ion-text-color)',
            padding: '0', height: '48px', marginTop: '12px',
          } as any}
        />
      )}
    </div>
    {loading && skeleton ? skeleton : children}
  </div>
);

export default AdminPageShell;
