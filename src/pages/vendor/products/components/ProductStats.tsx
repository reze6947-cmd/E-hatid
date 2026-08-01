import React from 'react';
import { IonIcon } from '@ionic/react';
import { restaurantOutline, checkmarkCircle, closeCircle, star } from 'ionicons/icons';
import { motion } from 'framer-motion';
import { AvailabilityFilter } from '../types';
import { ProductCounts } from '../hooks/useProductFilters';

interface ProductStatsProps {
  counts: ProductCounts;
  activeFilter: AvailabilityFilter;
  onFilterChange: (filter: AvailabilityFilter) => void;
}

const ProductStats: React.FC<ProductStatsProps> = ({ counts, activeFilter, onFilterChange }) => {
  const items: {
    key: AvailabilityFilter | null;
    label: string;
    value: number;
    icon: string;
    accent: string;
  }[] = [
    { key: 'all', label: 'Total', value: counts.total, icon: restaurantOutline, accent: 'text-[var(--ion-text-color)]' },
    { key: 'available', label: 'Available', value: counts.available, icon: checkmarkCircle, accent: 'text-[var(--ion-color-success)]' },
    { key: 'unavailable', label: 'Unavailable', value: counts.unavailable, icon: closeCircle, accent: 'text-[var(--ion-color-danger)]' },
    { key: null, label: 'Popular', value: counts.popular, icon: star, accent: 'text-[var(--ion-color-warning)]' },
  ];

  return (
    <div className="flex flex-wrap gap-2 sm:gap-2.5 mb-5">
      {items.map(stat => {
        const active = stat.key !== null && activeFilter === stat.key;
        const clickable = stat.key !== null;
        const inner = (
          <>
            <IonIcon icon={stat.icon} className={`text-base shrink-0 ${active ? 'text-white' : stat.accent}`} />
            <span className={`text-sm font-bold tabular-nums leading-none ${active ? 'text-white' : 'text-[var(--ion-text-color)]'}`}>{stat.value}</span>
            <span className={`text-xs font-medium leading-none ${active ? 'text-white/80' : 'text-[var(--ion-text-color-secondary)]'}`}>{stat.label}</span>
          </>
        );

        const pillClass = `inline-flex items-center gap-2 rounded-full border px-3.5 py-2 min-h-[44px] shadow-sm transition-colors ${
          active
            ? 'bg-[var(--ion-color-primary)] border-[var(--ion-color-primary)]'
            : 'bg-[var(--ion-card-background)] border-[var(--ion-border-color)] hover:border-[var(--ion-color-primary)]/50'
        }`;

        if (clickable) {
          return (
            <motion.button
              key={stat.label}
              type="button"
              layout
              whileTap={{ scale: 0.98 }}
              onClick={() => onFilterChange(stat.key as AvailabilityFilter)}
              aria-pressed={active}
              className={`${pillClass} cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ion-color-primary)] focus-visible:ring-offset-2`}
            >
              {inner}
            </motion.button>
          );
        }

        return (
          <motion.div key={stat.label} layout className={`${pillClass} pointer-events-none select-none`}>
            {inner}
          </motion.div>
        );
      })}
    </div>
  );
};

export default ProductStats;
