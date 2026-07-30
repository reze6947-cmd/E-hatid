import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { add, flame, checkmarkCircle } from 'ionicons/icons';
import { MenuItem as MenuItemType } from '../../types';

interface MenuItemProps {
  item: MenuItemType;
  onAdd: () => void;
  quantity?: number;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, onAdd, quantity }) => {
  return (
    <div className="rounded-xl overflow-hidden bg-[var(--ion-card-background)] border border-[var(--ion-border-color)] shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>

        {item.popular && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500/90 text-white px-2 py-1 rounded-full">
            <IonIcon icon={flame} className="text-xs" />
            <span className="text-xs font-semibold">Popular</span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-2 sm:p-3">
        <div className="flex justify-between items-start mb-1 sm:mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base text-[var(--ion-text-color)] mb-0.5 truncate group-hover:text-[var(--ion-color-primary)] transition-colors">
              {item.name}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--ion-text-color-secondary)] line-clamp-2">{item.description}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mt-auto pt-2 sm:pt-3 border-t border-[var(--ion-border-color)]">
          <span className="font-semibold text-sm sm:text-base text-[var(--ion-text-color)]">₱{item.price.toFixed(2)}</span>

          {quantity ? (
            <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
              <IonIcon icon={checkmarkCircle} className="text-xs" />
              <span className="font-semibold">x{quantity}</span>
            </div>
          ) : (
            <IonButton
              size="small"
              color="primary"
              shape="round"
              className="min-h-[36px] text-xs sm:text-sm m-0"
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
            >
              <IonIcon icon={add} slot="start" className="text-xs" />
              Add
            </IonButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItem;
