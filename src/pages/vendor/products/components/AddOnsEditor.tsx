import React from 'react';
import { IonButton, IonIcon, IonItem, IonInput } from '@ionic/react';
import { addOutline, trashOutline } from 'ionicons/icons';
import { MenuItemAddOn } from '../../../../types';
import { sanitizeMoney } from '../utils';
import SectionCard from './SectionCard';

interface AddOnsEditorProps {
  addOns: MenuItemAddOn[];
  onChange: (addOns: MenuItemAddOn[]) => void;
  id?: string;
}

const emptyAddOn = (): MenuItemAddOn => ({
  id: `addon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  price: 0,
});

const AddOnsEditor: React.FC<AddOnsEditorProps> = ({ addOns, onChange, id }) => {
  const addAddOn = () => onChange([...addOns, emptyAddOn()]);
  const removeAddOn = (addOnId: string) => onChange(addOns.filter(a => a.id !== addOnId));

  const updateAddOn = (addOnId: string, field: string, value: string | number) => {
    onChange(addOns.map(a => a.id === addOnId ? { ...a, [field]: value } : a));
  };

  return (
    <SectionCard
      id={id}
      title="Add-ons"
      className="mb-0 xl:self-start"
      bodyClassName="space-y-3 sm:space-y-4"
      right={addOns.length > 0 ? (
        <span className="text-[10px] sm:text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">{addOns.length}</span>
      ) : undefined}
    >
      <p className="text-[11px] text-[var(--ion-text-color-secondary)]">Upsell extras for an additional price (extra cheese, sauce, toppings)</p>
      {addOns.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--ion-background-color)] flex items-center justify-center mx-auto mb-2">
            <IonIcon icon={addOutline} className="text-[var(--ion-text-color-secondary)] text-lg sm:text-xl" />
          </div>
          <p className="text-xs sm:text-sm text-[var(--ion-text-color-secondary)]">No add-ons yet</p>
          <p className="text-[10px] sm:text-xs text-[var(--ion-text-color-secondary)] mt-1">Add extras like extra cheese, sauce, or toppings</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {addOns.map((addOn, ai) => (
            <div
              key={addOn.id}
              className={`flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 min-h-[44px] rounded-lg border border-[var(--ion-border-color)] ${ai % 2 === 0 ? 'bg-[var(--ion-background-color)]/30' : ''}`}
            >
              <span className="text-[10px] sm:text-xs font-bold text-[var(--ion-text-color-secondary)] w-4 sm:w-5 text-center shrink-0">{ai + 1}.</span>
              <IonItem className="ion-item-clean flex-1 min-w-0">
                <IonInput
                  value={addOn.name}
                  placeholder="Add-on name"
                  maxlength={30}
                  onIonChange={e => updateAddOn(addOn.id, 'name', e.detail.value!)}
                  className="text-xs sm:text-sm"
                />
              </IonItem>
              <span className="text-[10px] sm:text-xs text-[var(--ion-text-color-secondary)] shrink-0">₱</span>
              <IonItem className="ion-item-clean w-16 sm:w-24 shrink-0">
                <IonInput
                  type="text"
                  inputmode="decimal"
                  value={addOn.price}
                  placeholder="0"
                  onIonChange={e => updateAddOn(addOn.id, 'price', sanitizeMoney(e.detail.value ?? ''))}
                  className="text-xs sm:text-sm text-right"
                />
              </IonItem>
              <IonButton
                fill="clear"
                size="small"
                onClick={() => removeAddOn(addOn.id)}
                style={{ '--color': 'var(--ion-color-danger)', minHeight: '32px', height: '32px', width: '32px' }}
              >
                <IonIcon icon={trashOutline} className="text-xs" />
              </IonButton>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={addAddOn}
        className="w-full min-h-[44px] rounded-xl border-2 border-dashed border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2 hover:border-emerald-500 hover:bg-emerald-500/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        <IonIcon icon={addOutline} className="text-base" />
        Add Add-on
      </button>
    </SectionCard>
  );
};

export default AddOnsEditor;
