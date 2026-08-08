import React from 'react';
import { motion } from 'framer-motion';

interface FilterPillsProps {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  layoutId: string;
  even?: boolean;
}

const FilterPills: React.FC<FilterPillsProps> = ({ items, value, onChange, layoutId, even = false }) => (
  <div className="overflow-x-auto no-scrollbar">
    <div className={even
      ? "flex w-full gap-3 bg-[var(--ion-card-background)] p-1 rounded-full"
      : "flex gap-3 bg-[var(--ion-card-background)] p-1 rounded-full w-max min-w-full"}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`relative px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-95 rounded-full ${even ? 'flex-1 min-w-0' : 'min-w-[100px]'}`}
        >
          {value === item.id && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 bg-[var(--ion-color-primary)] rounded-full"
              transition={{ type: "spring", stiffness: 300, damping: 50, mass: 1.2 }}
            />
          )}
          <span className={`relative z-10 block truncate ${value === item.id ? "text-white" : "text-gray-500 dark:text-gray-300"}`}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  </div>
);

export default FilterPills;
