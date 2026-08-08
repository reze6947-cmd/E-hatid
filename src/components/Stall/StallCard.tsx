// src/components/Stall/StallCard.tsx
import React from 'react';
import { IonIcon } from '@ionic/react';
import { star, timeOutline, bicycleOutline } from 'ionicons/icons';
import { Stall } from '../../types';
import OptimizedImage from '../OptimizedImage';

interface StallCardProps {
  stall: Stall;
  onClick?: () => void;
}

const StallCard: React.FC<StallCardProps> = ({ stall, onClick }) => {
  return (
    <div
      className="rounded-xl overflow-hidden bg-[var(--ion-card-background)] border border-[var(--ion-border-color)] shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <OptimizedImage
          src={stall.image}
          alt={stall.name}
          width={480}
          height={360}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1 bg-white/90 text-gray-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
          <IonIcon icon={star} className="text-amber-500 text-xs" />
          {stall.rating}
        </div>
      </div>
      
      <div className="p-3 sm:p-4">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="text-sm sm:text-base font-bold text-[var(--ion-text-color)] m-0 truncate">
            {stall.name}
          </h3>
          <span className="text-xs font-semibold text-[var(--ion-color-primary)] bg-[var(--ion-color-primary)]/10 px-2 py-0.5 rounded-full shrink-0">
            {stall.cuisine}
          </span>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-[var(--ion-text-color-secondary)]">
          <span className="flex items-center gap-1">
            <IonIcon icon={timeOutline} className="text-sm" />
            {stall.deliveryTime}
          </span>
          <span className="flex items-center gap-1">
            <IonIcon icon={bicycleOutline} className="text-sm" />
            ₱{stall.deliveryFee.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StallCard;