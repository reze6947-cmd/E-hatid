import React from 'react';
import { IonIcon, IonButton } from '@ionic/react';
import { add, flame } from 'ionicons/icons';
import { MenuItem } from '../../types';

interface ProductCardProps {
  item: MenuItem;
  stallImage: string;
  onItemClick: (item: MenuItem) => void;
  showPopularBadge?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ item, stallImage, onItemClick, showPopularBadge }) => {
  return (
    <div
      className="rounded-xl bg-[var(--ion-card-background)] border border-[var(--ion-border-color)] shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onItemClick(item)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image || stallImage}
          alt={item.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {showPopularBadge && (
          <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow flex items-center gap-1">
            <IonIcon icon={flame} className="text-xs" />
            Popular
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm text-[var(--ion-text-color)] line-clamp-2">{item.name}</h3>
        {item.description && (
          <p className="text-xs text-[var(--ion-text-color-secondary)] line-clamp-2 mt-1">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="font-semibold text-sm text-[var(--ion-color-primary)]">₱{item.price.toFixed(2)}</span>
          <IonButton fill="outline" shape="round" size="small" color="primary" className="min-h-[32px] text-xs font-semibold m-0">
            <IonIcon icon={add} slot="start" className="text-xs" />
            Add
          </IonButton>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
