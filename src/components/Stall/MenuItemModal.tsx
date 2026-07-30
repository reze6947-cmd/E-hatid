import React, { useState, useMemo } from 'react';
import {
  IonModal,
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTextarea,
} from '@ionic/react';
import { closeOutline, add, remove, cartOutline, logInOutline } from 'ionicons/icons';
import { useAuth } from '../../context/AuthContext';
import { useHistory } from 'react-router-dom';
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
  const { user } = useAuth();
  const history = useHistory();
  const isGuest = !user;
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
    if (isGuest) {
      onClose();
      history.push('/login');
      return;
    }
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
    <div>
      <div className="relative aspect-[16/9] sm:aspect-[21/9] overflow-hidden">
        <div
          className="w-full h-full bg-center bg-cover"
          style={{ backgroundImage: `url(${item.image})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
          {!item.available && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-lg sm:text-xl bg-red-500 px-4 py-2 rounded-full">Currently Unavailable</span>
            </div>
          )}
          <h2 className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 text-white font-semibold text-lg sm:text-xl md:text-2xl drop-shadow-lg">
            {item.name}
          </h2>
        </div>
      </div>

      <div className="p-3 sm:p-4 md:p-5">
        <p className="text-xs sm:text-sm text-[var(--ion-text-color-secondary)] mb-2 sm:mb-3 leading-relaxed">{item.description}</p>
        <p className="font-medium text-xs sm:text-sm text-[var(--ion-color-primary)] mb-3 sm:mb-4">Base price: ₱{item.price.toFixed(2)}</p>

        {item.options?.map(option => (
          <div key={option.id} className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg border border-[var(--ion-border-color)] bg-[var(--ion-card-background)]">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="font-medium text-xs sm:text-sm text-[var(--ion-text-color)]">{option.name}</span>
              {option.required ? (
                <span className="text-[10px] sm:text-xs bg-[var(--ion-color-danger)]/10 text-[var(--ion-color-danger)] px-2 py-0.5 rounded-full">Required</span>
              ) : (
                <span className="text-[10px] sm:text-xs bg-gray-100 dark:bg-slate-700 text-[var(--ion-text-color-secondary)] px-2 py-0.5 rounded-full">Optional</span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
              {option.choices.map(choice => {
                const isSelected = selectedOptions[option.id] === choice.id;
                return (
                  <div
                    key={choice.id}
                    className={`flex items-center p-2.5 sm:p-3 rounded-lg cursor-pointer transition-all min-h-[44px] ${isSelected ? 'bg-[var(--ion-color-primary)]/10 border border-[var(--ion-color-primary)]' : 'hover:bg-gray-100 dark:hover:bg-slate-700 border border-transparent'}`}
                    onClick={() => handleOptionChange(option.id, choice.id)}
                  >
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 mr-2 sm:mr-3 flex items-center justify-center shrink-0 ${isSelected ? 'bg-[var(--ion-color-primary)] border-[var(--ion-color-primary)]' : 'border-[var(--ion-border-color)]'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />}
                    </div>
                    <span className="flex-1 font-medium text-xs sm:text-sm text-[var(--ion-text-color)]">{choice.name}</span>
                    {choice.price > 0 && (
                      <span className="text-[11px] sm:text-sm text-[var(--ion-color-success)] font-medium shrink-0">+₱{choice.price.toFixed(2)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {item.addOns && item.addOns.length > 0 && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg border border-[var(--ion-border-color)] bg-[var(--ion-card-background)]">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="font-medium text-xs sm:text-sm text-[var(--ion-text-color)]">Add-ons</span>
              <span className="text-[10px] sm:text-xs bg-gray-100 dark:bg-slate-700 text-[var(--ion-text-color-secondary)] px-2 py-0.5 rounded-full">Optional</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
              {item.addOns.map(addOn => {
                const isSelected = !!selectedAddOns[addOn.id];
                return (
                  <div
                    key={addOn.id}
                    className={`flex items-center p-2.5 sm:p-3 rounded-lg cursor-pointer transition-all min-h-[44px] ${isSelected ? 'bg-[var(--ion-color-success)]/10 border border-[var(--ion-color-success)]' : 'hover:bg-gray-100 dark:hover:bg-slate-700 border border-transparent'}`}
                    onClick={() => handleAddOnToggle(addOn.id)}
                  >
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border mr-2 sm:mr-3 flex items-center justify-center shrink-0 ${isSelected ? 'bg-[var(--ion-color-success)] border-[var(--ion-color-success)]' : 'border-[var(--ion-border-color)]'}`}>
                      {isSelected && <span className="text-white text-[10px] sm:text-xs">✓</span>}
                    </div>
                    <span className="flex-1 font-medium text-xs sm:text-sm text-[var(--ion-text-color)]">{addOn.name}</span>
                    <span className="text-[11px] sm:text-sm text-[var(--ion-text-color-secondary)] shrink-0">+₱{addOn.price.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg border border-[var(--ion-border-color)] bg-[var(--ion-card-background)]">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="font-medium text-xs sm:text-sm text-[var(--ion-text-color)]">Special Instructions</span>
            <span className="text-[10px] sm:text-xs bg-gray-100 dark:bg-slate-700 text-[var(--ion-text-color-secondary)] px-2 py-0.5 rounded-full">Optional</span>
          </div>
          <IonTextarea
            value={specialInstructions}
            onIonInput={e => setSpecialInstructions(e.detail.value || '')}
            placeholder="e.g., allergic to peanuts, no onions, extra sauce..."
            rows={3}
            className="text-xs sm:text-sm"
            style={{ '--background': 'var(--ion-background-color)', '--padding-start': '10px', '--padding-end': '10px', '--padding-top': '10px', '--padding-bottom': '10px', '--border-radius': '8px', '--highlight-height': '0' } as any}
          />
        </div>

        <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg border border-[var(--ion-border-color)] bg-[var(--ion-card-background)]">
          <span className="font-medium text-xs sm:text-sm text-[var(--ion-text-color)] mb-2 sm:mb-3 block">Quantity</span>
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <IonButton
              fill="outline"
              color="medium"
              shape="round"
              style={{ '--padding-start': '0', '--padding-end': '0', width: '40px', height: '40px' }}
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
            >
              <IonIcon icon={remove} slot="icon-only" />
            </IonButton>
            <span className="font-semibold text-base sm:text-lg w-10 sm:w-12 text-center text-[var(--ion-text-color)]">{quantity}</span>
            <IonButton
              fill="outline"
              color="medium"
              shape="round"
              style={{ '--padding-start': '0', '--padding-end': '0', width: '40px', height: '40px' }}
              onClick={() => setQuantity(q => q + 1)}
            >
              <IonIcon icon={add} slot="icon-only" />
            </IonButton>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 bg-[var(--ion-card-background)] border-t border-[var(--ion-border-color)]">
          <IonButton
            expand="block"
            size="large"
            shape="round"
            className="min-h-[48px]"
            style={{ fontSize: '14px', fontWeight: 600, '--background': !item.available ? '#9CA3AF' : 'var(--ion-color-primary)' }}
            disabled={isGuest ? false : !allRequiredFilled || !item.available}
            onClick={handleAddToCart}
          >
            {isGuest ? (
              <><IonIcon icon={logInOutline} slot="start" className="mr-2" />Sign in to Order</>
            ) : (
              <><IonIcon icon={cartOutline} slot="start" className="mr-2" />{item.available ? `Add to Cart • ₱${totalPrice.toFixed(2)}` : 'Currently Unavailable'}</>
            )}
          </IonButton>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <IonPage className="menu-item-page">
        <IonHeader className="ion-no-border">
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={onClose}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'var(--ion-background-color)' }}>
          {content}
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      className="menu-item-modal"
      style={{ '--max-width': 'min(560px, 95vw)', '--max-height': '90vh', '--border-radius': '16px' } as any}
    >
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="end">
            <IonButton onClick={onClose} className="min-h-[44px] min-w-[44px]">
              <IonIcon icon={closeOutline} className="text-xl" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ '--background': 'var(--ion-background-color)' }}>
        {content}
      </IonContent>
    </IonModal>
  );
};

export default MenuItemModal;
