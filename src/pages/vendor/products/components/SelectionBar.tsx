import React from 'react';
import { IonIcon } from '@ionic/react';
import {
  checkmarkDoneOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  trashOutline,
  closeOutline,
} from 'ionicons/icons';

interface SelectionBarProps {
  selectedCount: number;
  onSelectAllVisible: () => void;
  onSetAvailable: () => void;
  onSetUnavailable: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

const pill = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ion-color-primary)] focus-visible:ring-offset-2';

const SelectionBar: React.FC<SelectionBarProps> = ({
  selectedCount,
  onSelectAllVisible,
  onSetAvailable,
  onSetUnavailable,
  onDelete,
  onCancel,
}) => (
  <div className="sticky top-0 z-30 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 pt-3 pb-3 mb-5 bg-[var(--ion-background-color)]/90 backdrop-blur-md border-b border-[var(--ion-color-primary)]/30 shadow-sm">
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
      <span className="text-sm font-bold text-[var(--ion-text-color)] tabular-nums">
        {selectedCount} selected
      </span>
      <button type="button" onClick={onSelectAllVisible} className={`${pill} bg-[var(--ion-color-primary)] text-white`}>
        <IonIcon icon={checkmarkDoneOutline} className="text-sm" />
        Select all
      </button>
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        <button
          type="button"
          onClick={onSetAvailable}
          className={`${pill} bg-[var(--ion-color-success)]/10 text-[var(--ion-color-success)] hover:bg-[var(--ion-color-success)]/20`}
        >
          <IonIcon icon={checkmarkCircleOutline} className="text-sm" />
          <span className="hidden sm:inline">Make Available</span>
          <span className="sm:hidden">Available</span>
        </button>
        <button
          type="button"
          onClick={onSetUnavailable}
          className={`${pill} bg-[var(--ion-border-color)]/40 text-[var(--ion-text-color-secondary)] hover:bg-[var(--ion-border-color)]/70`}
        >
          <IonIcon icon={closeCircleOutline} className="text-sm" />
          <span className="hidden sm:inline">Make Unavailable</span>
          <span className="sm:hidden">Hide</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={selectedCount === 0}
          className={`${pill} bg-[var(--ion-color-danger)]/10 text-[var(--ion-color-danger)] hover:bg-[var(--ion-color-danger)]/20 disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <IonIcon icon={trashOutline} className="text-sm" />
          <span className="hidden sm:inline">Delete</span>
          <span className="sm:hidden">Delete</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`${pill} bg-[var(--ion-card-background)] border border-[var(--ion-border-color)] text-[var(--ion-text-color)] hover:bg-[var(--ion-border-color)]/40`}
        >
          <IonIcon icon={closeOutline} className="text-sm" />
          <span className="hidden sm:inline">Cancel</span>
          <span className="sm:hidden">Done</span>
        </button>
      </div>
    </div>
  </div>
);

export default SelectionBar;
