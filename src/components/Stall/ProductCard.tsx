import React from 'react';
import { IonIcon, IonButton } from '@ionic/react';
import { add, flame } from 'ionicons/icons';
import { MenuItem } from '../../types';
import OptimizedImage from '../OptimizedImage';

interface ProductCardProps {
  item: MenuItem;
  stallImage: string;
  onItemClick: (item: MenuItem) => void;
  showPopularBadge?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ item, stallImage, onItemClick, showPopularBadge }) => {
  return (
    <div
      className="flex rounded-xl bg-[var(--ion-card-background)] border border-[var(--ion-border-color)] shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
      onClick={() => onItemClick(item)}
    >
      <div className="relative w-24 xs:w-28 sm:w-32 md:w-40 lg:w-48 xl:w-56 shrink-0 self-start aspect-square overflow-hidden bg-[var(--ion-background-color)]">
        <OptimizedImage
          src={item.image || stallImage}
          alt={item.name}
          width={224}
          height={224}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {showPopularBadge && (
          <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow flex items-center gap-1">
            <IonIcon icon={flame} className="text-xs" />
            Popular
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 min-w-0 p-3 sm:p-4">
        <h3 className="font-semibold text-sm text-[var(--ion-text-color)] line-clamp-2 leading-snug">{item.name}</h3>
        {item.description && (
          <p className="text-xs text-[var(--ion-text-color-secondary)] line-clamp-2 mt-1">{item.description}</p>
        )}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2 sm:pt-3">
          <span className="font-bold text-sm sm:text-base text-[var(--ion-color-primary)]">₱{item.price.toFixed(2)}</span>
          <IonButton fill="outline" shape="round" size="small" color="primary" className="min-h-[34px] text-xs font-semibold m-0 shrink-0">
            <IonIcon icon={add} slot="start" className="text-xs" />
            Add
          </IonButton>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
