import React, { useState, useMemo } from 'react';
import {
  IonModal,
  IonPage,
  IonContent,
  IonIcon,
  IonTextarea,
} from '@ionic/react';
import { closeOutline, add, remove, cartOutline, checkmarkCircle } from 'ionicons/icons';
import { MenuItem, SelectedOption, SelectedAddOn } from '../../types';

interface MenuItemModalProps {
  item: MenuItem;
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  onAddToCart: (input: {
    item: MenuItem;
    selectedOptions: SelectedOption[];
    selectedAddOns: SelectedAddOn[];
    specialInstructions: string;
  }) => void;
}

const MenuItemModal: React.FC<MenuItemModalProps> = ({
  item,
  isOpen,
  isMobile,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, boolean>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');

  const handleOptionChange = (optionId: string, choiceId: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionId]: choiceId }));
  };

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns(prev => ({ ...prev, [addOnId]: !prev[addOnId] }));
  };

  const selectedOptionsList: SelectedOption[] = useMemo(() => {
    return Object.entries(selectedOptions)
      .map(([optionId, choiceId]) => {
        const option = item.options?.find(o => o.id === optionId);
        const choice = option?.choices.find(c => c.id === choiceId);
        if (!option || !choice) return null;
        return {
          optionId,
          optionName: option.name,
          choiceId,
          choiceName: choice.name,
          choicePrice: choice.price,
        };
      })
      .filter((o): o is SelectedOption => o !== null);
  }, [selectedOptions, item.options]);

  const selectedAddOnsList: SelectedAddOn[] = useMemo(() => {
    return Object.entries(selectedAddOns)
      .filter(([, selected]) => selected)
      .map(([addOnId]) => {
        const addOn = item.addOns?.find(a => a.id === addOnId);
        if (!addOn) return null;
        return { addOnId: addOn.id, name: addOn.name, price: addOn.price };
      })
      .filter((a): a is SelectedAddOn => a !== null);
  }, [selectedAddOns, item.addOns]);

  const totalPrice = useMemo(() => {
    const optionsPrice = selectedOptionsList.reduce((s, o) => s + o.choicePrice, 0);
    const addOnsPrice = selectedAddOnsList.reduce((s, a) => s + a.price, 0);
    return (item.price + optionsPrice + addOnsPrice) * quantity;
  }, [item.price, selectedOptionsList, selectedAddOnsList, quantity]);

  const allRequiredFilled = useMemo(() => {
    if (!item.options) return true;
    return item.options
      .filter(o => o.required)
      .every(o => selectedOptions[o.id]);
  }, [item.options, selectedOptions]);

  const handleAddToCart = () => {
    onAddToCart({
      item,
      selectedOptions: selectedOptionsList,
      selectedAddOns: selectedAddOnsList,
      specialInstructions,
    });
    setQuantity(1);
    setSelectedOptions({});
    setSelectedAddOns({});
    setSpecialInstructions('');
    onClose();
  };

  const content = (
    <>
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9] max-h-[50vh] landscape:max-h-[42vh] overflow-hidden rounded-none">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        {!item.available && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center z-10">
            <span className="text-white font-bold text-sm sm:text-base md:text-lg bg-red-500 px-4 py-2 rounded-full shadow-lg backdrop-blur-sm">Currently Unavailable</span>
          </div>
        )}
        <button
          onClick={onClose}
          aria-label="Close"
          className={`absolute top-3 md:top-4 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${isMobile ? 'left-3 md:left-4' : 'right-3 md:right-4'}`}
        >
          <IonIcon icon={closeOutline} className="text-lg" />
        </button>
        <span className={`absolute top-3 md:top-4 z-10 bg-white/95 text-[#1E1B4B] font-bold text-xs sm:text-sm px-3 py-1.5 rounded-full shadow flex items-center gap-1 ${isMobile ? 'right-3 md:right-4' : 'left-3 md:left-4'}`}>
          <IonIcon icon={cartOutline} className="text-xs" />
          ₱{item.price.toFixed(2)}
        </span>
        <div className="absolute bottom-3 sm:bottom-4 left-4 right-4 sm:left-5 sm:right-5 z-10">
          {item.category && (
            <p className="text-[11px] sm:text-xs text-white/80 font-semibold mb-0.5 uppercase tracking-wider">{item.category}</p>
          )}
          <h2 className="text-white font-bold text-xl sm:text-2xl md:text-[1.75rem] lg:text-3xl drop-shadow-lg leading-tight">{item.name}</h2>
        </div>
      </div>

      <div className="px-4 sm:px-6 md:px-8 lg:px-6 pt-4 sm:pt-5 md:pt-6 pb-[calc(11.5rem+env(safe-area-inset-bottom,0px))] md:pb-8 max-w-3xl mx-auto">
        {item.description && (
          <p className="text-sm sm:text-[15px] md:text-base text-[var(--ion-text-color-secondary)] leading-relaxed">{item.description}</p>
        )}

        {item.options?.map(option => (
          <div key={option.id} className="mt-5 sm:mt-6 md:mt-7">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <h3 className="text-base sm:text-[17px] font-bold text-[var(--ion-text-color)] m-0">{option.name}</h3>
              {option.required ? (
                <span className="text-[10px] sm:text-xs bg-[var(--ion-color-danger)]/10 text-[var(--ion-color-danger)] px-2 py-0.5 rounded-full font-semibold shrink-0">Required</span>
              ) : (
                <span className="text-[10px] sm:text-xs bg-gray-100 dark:bg-slate-700 text-[var(--ion-text-color-secondary)] px-2 py-0.5 rounded-full font-semibold shrink-0">Optional</span>
              )}
            </div>
            <div className="rounded-xl border border-[var(--ion-border-color)] divide-y divide-[var(--ion-border-color)] overflow-hidden">
              {option.choices.map(choice => {
                const isSelected = selectedOptions[option.id] === choice.id;
                return (
                  <button
                    type="button"
                    key={choice.id}
                    className={`w-full flex items-center py-3 sm:py-3.5 px-3 sm:px-4 cursor-pointer transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ion-color-primary)] ${isSelected ? 'bg-[var(--ion-color-primary)]/[0.06]' : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'}`}
                    onClick={() => handleOptionChange(option.id, choice.id)}
                  >
                    <div className={`w-5 h-5 sm:w-[22px] sm:h-[22px] rounded-full border-2 mr-3 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-[var(--ion-color-primary)]' : 'border-gray-300 dark:border-slate-600'}`}>
                      {isSelected && <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[var(--ion-color-primary)]" />}
                    </div>
                    <span className={`flex-1 font-medium text-sm sm:text-[15px] ${isSelected ? 'text-[var(--ion-color-primary)]' : 'text-[var(--ion-text-color)]'}`}>{choice.name}</span>
                    {choice.price > 0 && (
                      <span className={`text-sm sm:text-[15px] font-semibold shrink-0 tabular-nums ${isSelected ? 'text-[var(--ion-color-primary)]' : 'text-[var(--ion-text-color-secondary)]'}`}>+₱{choice.price.toFixed(2)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {item.addOns && item.addOns.length > 0 && (
          <div className="mt-5 sm:mt-6 md:mt-7">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <h3 className="text-base sm:text-[17px] font-bold text-[var(--ion-text-color)] m-0">Add-ons</h3>
              <span className="text-[10px] sm:text-xs bg-gray-100 dark:bg-slate-700 text-[var(--ion-text-color-secondary)] px-2 py-0.5 rounded-full font-semibold shrink-0">Optional</span>
            </div>
            <div className="rounded-xl border border-[var(--ion-border-color)] divide-y divide-[var(--ion-border-color)] overflow-hidden">
              {item.addOns.map(addOn => {
                const isSelected = !!selectedAddOns[addOn.id];
                return (
                  <button
                    type="button"
                    key={addOn.id}
                    className={`w-full flex items-center py-3 sm:py-3.5 px-3 sm:px-4 cursor-pointer transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ion-color-success)] ${isSelected ? 'bg-[var(--ion-color-success)]/[0.07]' : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'}`}
                    onClick={() => handleAddOnToggle(addOn.id)}
                  >
                    <div className={`w-5 h-5 sm:w-[22px] sm:h-[22px] rounded-md border-2 mr-3 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[var(--ion-color-success)] border-[var(--ion-color-success)]' : 'border-gray-300 dark:border-slate-600'}`}>
                      {isSelected && <IonIcon icon={checkmarkCircle} className="text-white text-sm sm:text-base" />}
                    </div>
                    <span className={`flex-1 font-medium text-sm sm:text-[15px] ${isSelected ? 'text-[var(--ion-color-success)]' : 'text-[var(--ion-text-color)]'}`}>{addOn.name}</span>
                    <span className="text-sm sm:text-[15px] text-[var(--ion-text-color-secondary)] font-semibold shrink-0 tabular-nums">+₱{addOn.price.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5 sm:mt-6 md:mt-7">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-base sm:text-[17px] font-bold text-[var(--ion-text-color)] m-0">Special Instructions</h3>
            <span className="text-[10px] sm:text-xs bg-gray-100 dark:bg-slate-700 text-[var(--ion-text-color-secondary)] px-2 py-0.5 rounded-full font-semibold shrink-0">Optional</span>
          </div>
          <IonTextarea
            value={specialInstructions}
            onIonInput={e => setSpecialInstructions(e.detail.value || '')}
            placeholder="e.g., allergic to peanuts, no onions, extra sauce..."
            rows={3}
            className="text-sm sm:text-[15px] field-box"
          />
        </div>

        <div className="mt-5 sm:mt-6 md:mt-7">
          <h3 className="text-base sm:text-[17px] font-bold text-[var(--ion-text-color)] m-0 mb-3 text-center sm:text-left">Quantity</h3>
          <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-5">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] text-[var(--ion-text-color)] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ion-color-primary)] focus-visible:ring-offset-2"
            >
              <IonIcon icon={remove} className="text-lg" />
            </button>
            <span className="font-bold text-lg sm:text-xl min-w-[7ch] tabular-nums text-center text-[var(--ion-text-color)]">{quantity}</span>
            <button
              onClick={() => setQuantity(q => Math.min(9999999, q + 1))}
              aria-label="Increase quantity"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[var(--ion-color-primary)] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ion-color-primary)] focus-visible:ring-offset-2"
            >
              <IonIcon icon={add} className="text-lg" />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const footerContent = (
    <div className="flex items-center justify-between gap-3 max-w-3xl mx-auto">
      <div className="min-w-0">
        <p className="text-[10px] sm:text-[11px] text-[var(--ion-text-color-secondary)] m-0 font-medium uppercase tracking-wide">Total</p>
        <p className="font-bold text-base sm:text-lg md:text-xl text-[var(--ion-text-color)] m-0 truncate tabular-nums">₱{totalPrice.toFixed(2)}</p>
      </div>
      <button
        onClick={handleAddToCart}
        disabled={!allRequiredFilled || !item.available}
        className={`flex-1 min-w-[140px] xs:min-w-[160px] max-w-[260px] md:max-w-[300px] min-h-[48px] sm:min-h-[52px] rounded-full text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ion-color-primary)] focus-visible:ring-offset-2 ${item.available ? 'bg-[var(--ion-color-primary)] hover:bg-[var(--ion-color-primary-shade)] disabled:opacity-50' : 'bg-[#9CA3AF]'}`}
      >
        <><IonIcon icon={cartOutline} className="text-base" />{item.available ? 'Add to Cart' : 'Currently Unavailable'}</>
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <IonPage className="menu-item-page">
        <IonContent style={{ '--background': 'var(--ion-background-color)' }}>
          {content}
        </IonContent>
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-20 p-3 sm:p-4 bg-[var(--ion-card-background)] border-t border-[var(--ion-border-color)] shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          {footerContent}
        </div>
      </IonPage>
    );
  }

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      className="menu-item-modal"
      style={{ '--width': 'min(calc(420px + 8vw), 620px)', '--max-width': 'min(calc(420px + 8vw), 620px)', '--max-height': '90vh', '--border-radius': '20px' } as any}
    >
      <IonContent style={{ '--background': 'var(--ion-background-color)' }}>
        {content}
      </IonContent>
      <div className="p-3 sm:p-4 md:p-5 bg-[var(--ion-card-background)] border-t border-[var(--ion-border-color)]">
        {footerContent}
      </div>
    </IonModal>
  );
};

export default MenuItemModal;