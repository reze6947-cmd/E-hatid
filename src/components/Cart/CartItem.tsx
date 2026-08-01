// src/components/Cart/CartItem.tsx
import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { add, remove, trash } from 'ionicons/icons';
import { CartItem as CartItemType } from '../../types';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const hasCustomizations = (item.selectedOptions && item.selectedOptions.length > 0) ||
    (item.selectedAddOns && item.selectedAddOns.length > 0) ||
    item.specialInstructions;

  return (
    <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-[var(--ion-card-background)] border border-[var(--ion-border-color)] shadow-sm">
      <div className="relative w-full xs:w-24 sm:w-28 aspect-square shrink-0 mx-auto xs:mx-0">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
      </div>

      <div className="flex flex-col flex-1 min-w-0 w-full">
        <div className="flex-1">
          <h4 className="font-semibold text-sm sm:text-base text-[var(--ion-text-color)] mb-1 sm:mb-2 truncate">{item.name}</h4>
          {hasCustomizations && (
            <div className="flex flex-wrap gap-1.5 text-[11px] sm:text-xs mb-2">
              {item.selectedOptions?.map(opt => (
                <span key={opt.optionId} className="text-[var(--ion-text-color-secondary)]">
                  {opt.optionName}: <span className="font-semibold text-[var(--ion-text-color)]">{opt.choiceName}</span>
                  {opt.choicePrice > 0 && <span className="text-[var(--ion-color-success)] font-medium">+₱{opt.choicePrice.toFixed(2)}</span>}
                </span>
              ))}
              {item.selectedAddOns?.map(addOn => (
                <span key={addOn.addOnId} className="text-[var(--ion-text-color-secondary)]">
                  + <span className="font-medium text-[var(--ion-text-color)]">{addOn.name}</span> <span className="text-[var(--ion-color-success)] font-medium">₱{addOn.price.toFixed(2)}</span>
                </span>
              ))}
              {item.specialInstructions && (
                <span className="text-[var(--ion-color-warning)] font-medium">
                  📝 {item.specialInstructions}
                </span>
              )}
            </div>
          )}
          <p className="text-xs sm:text-sm text-[var(--ion-text-color-secondary)]">₱{item.price.toFixed(2)} each</p>
        </div>

        <div className="flex justify-between items-center mt-2 pt-2 sm:mt-3 sm:pt-3 border-t border-[var(--ion-border-color)]">
          <span className="text-xs sm:text-sm text-[var(--ion-text-color-secondary)]">Total:</span>
          <span className="font-semibold text-sm sm:text-base text-[var(--ion-text-color)]">₱{(item.price * item.quantity).toFixed(2)}</span>
        </div>
      </div>

      <div className="flex xs:flex-col justify-between xs:justify-center items-center xs:items-stretch gap-2 xs:gap-3 pt-2 xs:pt-0 border-t xs:border-t-0 border-[var(--ion-border-color)]">
        <div className="flex items-center gap-2">
          <IonButton
            className="min-w-[40px] min-h-[40px] w-10 h-10 rounded-lg"
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            title="Decrease quantity"
            style={{ '--background': item.quantity === 1 ? 'var(--ion-color-danger)' : 'var(--ion-color-primary)', '--color': '#fff', '--padding': '0' }}
          >
            <IonIcon icon={item.quantity === 1 ? trash : remove} className="text-xl" />
          </IonButton>

          <span className="font-medium text-xl w-10 text-center text-[var(--ion-text-color)]">{item.quantity}</span>

          <IonButton
            className="min-w-[40px] min-h-[40px] w-10 h-10 rounded-lg"
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            title="Increase quantity"
            style={{ '--background': 'var(--ion-color-primary)', '--color': '#fff', '--padding': '0' }}
          >
            <IonIcon icon={add} className="text-xl" />
          </IonButton>
        </div>

        <IonButton
          className="text-xs sm:text-sm font-medium min-h-[36px]"
          onClick={onRemove}
          title="Remove item"
          style={{ '--background': 'var(--ion-color-danger)/10', '--color': 'var(--ion-color-danger)' }}
        >
          <IonIcon icon={trash} className="mr-1" /> Remove
        </IonButton>
      </div>
    </div>
  );
};

export default CartItem;