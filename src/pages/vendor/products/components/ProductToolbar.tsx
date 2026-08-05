import React from 'react';
import { IonButton, IonIcon, IonSelect, IonSelectOption, IonSpinner } from '@ionic/react';
import {
  addOutline,
  searchOutline,
  closeCircleOutline,
  optionsOutline,
  checkboxOutline,
} from 'ionicons/icons';
import { SORT_OPTIONS, SortKey } from '../types';

interface ProductToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: SortKey;
  onSortChange: (sort: SortKey) => void;
  totalCount: number;
  visibleCount: number;
  hasActiveFilters: boolean;
  saving: boolean;
  onClearFilters: () => void;
  onAdd: () => void;
  onSelectMode: () => void;
}

const ProductToolbar: React.FC<ProductToolbarProps> = ({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  totalCount,
  visibleCount,
  hasActiveFilters,
  saving,
  onClearFilters,
  onAdd,
  onSelectMode,
}) => (
  <div className="sticky top-0 z-30 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 pt-3 pb-3 mb-5 bg-[var(--ion-background-color)]/85 backdrop-blur-md border-b border-[var(--ion-border-color)]">
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-0">
          <IonIcon icon={searchOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ion-text-color-secondary)] text-base pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search products by name or category..."
            className="w-full h-11 pl-9 pr-9 text-sm rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] text-[var(--ion-text-color)] placeholder:text-[var(--ion-text-color-secondary)] outline-none focus:border-[var(--ion-color-primary)] focus:ring-2 focus:ring-[var(--ion-color-primary-tint)] transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-[var(--ion-text-color-secondary)] hover:bg-[var(--ion-border-color)]/40 transition-colors"
            >
              <IonIcon icon={closeCircleOutline} className="text-lg" />
            </button>
          )}
        </div>
        <IonButton
          fill="outline"
          shape="round"
          className="shrink-0 min-h-[44px] font-semibold text-sm"
          onClick={onSelectMode}
          aria-label="Select multiple products"
        >
          <IonIcon icon={checkboxOutline} slot="start" />
          <span className="hidden sm:inline">Select</span>
          <span className="sm:hidden">Pick</span>
        </IonButton>
        <IonButton color="primary" shape="round" className="shrink-0 min-h-[44px] font-semibold text-sm sm:hidden" onClick={onAdd}>
          <IonIcon icon={addOutline} slot="start" />
          Add
        </IonButton>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center h-11 rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] px-3 focus-within:border-[var(--ion-color-primary)] transition-colors">
          <IonIcon icon={optionsOutline} className="text-[var(--ion-text-color-secondary)] shrink-0 mr-1.5 text-base" />
          <IonSelect
            value={sortBy}
            onIonChange={e => onSortChange(e.detail.value)}
            interface="popover"
            className="product-sort"
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map(opt => (
              <IonSelectOption key={opt.value} value={opt.value}>{opt.label}</IonSelectOption>
            ))}
          </IonSelect>
        </div>

        <div className="flex items-center gap-2 ml-auto text-[11px] sm:text-xs text-[var(--ion-text-color-secondary)]">
          {saving && (
            <span className="flex items-center gap-1.5 font-medium text-[var(--ion-color-primary)]">
              <IonSpinner name="crescent" style={{ width: 14, height: 14 }} />
              Saving…
            </span>
          )}
          {!saving && (
            <span className="font-medium tabular-nums">
              Showing {visibleCount} of {totalCount}
            </span>
          )}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--ion-border-color)]/40 text-[var(--ion-text-color-secondary)] hover:bg-[var(--ion-border-color)]/70 transition-colors font-semibold"
            >
              <IonIcon icon={closeCircleOutline} className="text-xs" />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default ProductToolbar;
