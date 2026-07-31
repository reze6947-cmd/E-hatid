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
    bg: string;
  }[] = [
    { key: 'all', label: 'Total', value: counts.total, icon: restaurantOutline, accent: 'text-[var(--ion-text-color)]', bg: 'bg-[var(--ion-color-primary)]/10' },
    { key: 'available', label: 'Available', value: counts.available, icon: checkmarkCircle, accent: 'text-[var(--ion-color-success)]', bg: 'bg-[var(--ion-color-success)]/10' },
    { key: 'unavailable', label: 'Unavailable', value: counts.unavailable, icon: closeCircle, accent: 'text-[var(--ion-color-danger)]', bg: 'bg-[var(--ion-color-danger)]/10' },
    { key: null, label: 'Popular', value: counts.popular, icon: star, accent: 'text-[var(--ion-color-warning)]', bg: 'bg-[var(--ion-color-warning)]/10' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-5">
      {items.map(stat => {
        const active = stat.key !== null && activeFilter === stat.key;
        const clickable = stat.key !== null;
        const inner = (
          <>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
              <IonIcon icon={stat.icon} className={`text-lg ${stat.accent}`} />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold m-0 leading-none tabular-nums text-[var(--ion-text-color)]">{stat.value}</p>
              <p className="text-[11px] text-[var(--ion-text-color-secondary)] m-0 mt-1 font-medium truncate">{stat.label}</p>
            </div>
          </>
        );

        if (clickable) {
          return (
            <motion.button
              key={stat.label}
              type="button"
              layout
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onFilterChange(stat.key as AvailabilityFilter)}
              aria-pressed={active}
              className={`flex items-center gap-2.5 sm:gap-3 rounded-2xl border p-3 sm:p-4 shadow-sm text-left cursor-pointer transition-colors ${
                active
                  ? 'border-[var(--ion-color-primary)] ring-2 ring-[var(--ion-color-primary)]/30 bg-[var(--ion-card-background)]'
                  : 'border-[var(--ion-border-color)] bg-[var(--ion-card-background)] hover:border-[var(--ion-color-primary)]/50'
              }`}
            >
              {inner}
            </motion.button>
          );
        }

        return (
          <motion.div
            key={stat.label}
            layout
            className="flex items-center gap-2.5 sm:gap-3 rounded-2xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] p-3 sm:p-4 shadow-sm"
          >
            {inner}
          </motion.div>
        );
      })}
    </div>
  );
};

export default ProductStats;
