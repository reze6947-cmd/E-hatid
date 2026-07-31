import React, { useState } from 'react';
import { IonButton, IonIcon, IonItem, IonInput, IonLabel, IonToggle } from '@ionic/react';
import { addOutline, add, remove, trashOutline, chevronDownOutline, chevronUpOutline } from 'ionicons/icons';
import { MenuItemOption, OptionChoice } from '../../../../types';
import { sanitizeMoney } from '../utils';
import SectionCard from './SectionCard';

interface OptionsEditorProps {
  options: MenuItemOption[];
  onChange: (options: MenuItemOption[]) => void;
  id?: string;
}

const emptyOption = (): MenuItemOption => ({
  id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  required: false,
  maxSelections: 1,
  choices: [],
});

const emptyChoice = (): OptionChoice => ({
  id: `ch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  price: 0,
});

const OptionsEditor: React.FC<OptionsEditorProps> = ({ options, onChange, id }) => {
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const toggleCollapsed = (optId: string) => {
    setCollapsed(prev => (prev.includes(optId) ? prev.filter(o => o !== optId) : [...prev, optId]));
  };

  const addOption = () => onChange([...options, emptyOption()]);
  const removeOption = (optId: string) => onChange(options.filter(o => o.id !== optId));

  const updateOption = (optId: string, field: string, value: string | boolean | number) => {
    onChange(options.map(o => o.id === optId ? { ...o, [field]: value } : o));
  };

  const addChoice = (optId: string) => {
    onChange(options.map(o => o.id === optId ? { ...o, choices: [...o.choices, emptyChoice()] } : o));
  };

  const removeChoice = (optId: string, chId: string) => {
    onChange(options.map(o => o.id === optId ? { ...o, choices: o.choices.filter(c => c.id !== chId) } : o));
  };

  const updateChoice = (optId: string, chId: string, field: string, value: string | number) => {
    onChange(options.map(o => o.id === optId ? {
      ...o,
      choices: o.choices.map(c => c.id === chId ? { ...c, [field]: value } : c),
    } : o));
  };

  return (
    <SectionCard
      id={id}
      title="Options"
      className="mb-0"
      bodyClassName="space-y-3 sm:space-y-4"
      right={options.length > 0 ? (
        <span className="bg-[var(--ion-color-primary)] text-white px-2 py-0.5 text-[10px] sm:text-xs rounded-full font-semibold">{options.length}</span>
      ) : undefined}
    >
      <p className="text-[11px] text-[var(--ion-text-color-secondary)]">Let customers customize their order — size, drink, or extras</p>
      {options.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--ion-background-color)] flex items-center justify-center mx-auto mb-2">
            <IonIcon icon={addOutline} className="text-[var(--ion-text-color-secondary)] text-lg sm:text-xl" />
          </div>
          <p className="text-xs sm:text-sm text-[var(--ion-text-color-secondary)]">No option groups yet</p>
          <p className="text-[10px] sm:text-xs text-[var(--ion-text-color-secondary)] mt-1">Add choices like size, drink, or toppings</p>
        </div>
      ) : (
        options.map((option, oi) => {
          const isCollapsed = collapsed.includes(option.id);
          return (
            <div
              key={option.id}
              className="rounded-xl border border-[var(--ion-border-color)] overflow-hidden bg-[var(--ion-background-color)]/30"
            >
              <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--ion-color-primary)]/10 border-b border-[var(--ion-border-color)]">
                <button
                  type="button"
                  onClick={() => toggleCollapsed(option.id)}
                  aria-expanded={!isCollapsed}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ion-color-primary)] rounded"
                >
                  <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--ion-color-primary)] text-white text-[10px] sm:text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                    {oi + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[var(--ion-text-color)] truncate">
                    {option.name || `Option ${oi + 1}`}
                  </span>
                  {option.required ? (
                    <span className="text-[10px] sm:text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 sm:px-2 py-0.5 rounded-full font-medium shrink-0">Required</span>
                  ) : (
                    <span className="text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-700 text-[var(--ion-text-color-secondary)] px-1.5 sm:px-2 py-0.5 rounded-full font-medium shrink-0">Optional</span>
                  )}
                  <IonIcon icon={isCollapsed ? chevronDownOutline : chevronUpOutline} className="text-sm text-[var(--ion-text-color-secondary)] ml-auto shrink-0" />
                </button>
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={() => removeOption(option.id)}
                  style={{ '--color': 'var(--ion-color-danger)', minHeight: '28px', height: '28px', margin: 0 }}
                  aria-label={`Remove option ${option.name || oi + 1}`}
                >
                  <IonIcon icon={trashOutline} className="text-sm" />
                </IonButton>
              </div>

              {!isCollapsed && (
                <div className="p-3 sm:p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 px-3 py-2 min-h-[52px] rounded-lg border border-[var(--ion-border-color)] bg-[var(--ion-card-background)]">
                      <div className="flex flex-col">
                        <IonLabel className="text-xs font-medium text-[var(--ion-text-color-secondary)] shrink-0">Required</IonLabel>
                        <span className="text-[11px] text-[var(--ion-text-color-secondary)]">Customer must pick from this group</span>
                      </div>
                      <IonToggle
                        checked={option.required}
                        className="ml-auto"
                        onIonChange={e => updateOption(option.id, 'required', e.detail.checked)}
                        style={{
                          '--background': 'var(--ion-border-color)',
                          '--background-checked': 'var(--ion-color-danger)',
                          '--handle-background': '#fff',
                          '--handle-background-checked': '#fff',
                        } as React.CSSProperties & Record<string, string>}
                      />
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 min-h-[52px] rounded-lg border border-[var(--ion-border-color)] bg-[var(--ion-card-background)]">
                      <div className="flex flex-col">
                        <IonLabel className="text-xs font-medium text-[var(--ion-text-color-secondary)] shrink-0">Max picks</IonLabel>
                        <span className="text-[11px] text-[var(--ion-text-color-secondary)]">How many choices can they select?</span>
                      </div>
                      <div className="flex items-center gap-1 ml-auto shrink-0">
                        <button
                          className="w-7 h-7 rounded-full border border-[var(--ion-border-color)] text-[var(--ion-text-color)] flex items-center justify-center text-sm active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ion-color-primary)]"
                          onClick={() => updateOption(option.id, 'maxSelections', Math.max(1, option.maxSelections - 1))}
                          aria-label="Decrease max picks"
                        >
                          <IonIcon icon={remove} className="text-sm" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums text-[var(--ion-text-color)]">{option.maxSelections}</span>
                        <button
                          className="w-7 h-7 rounded-full bg-[var(--ion-color-primary)] text-white flex items-center justify-center text-sm active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ion-color-primary)] focus-visible:ring-offset-2"
                          onClick={() => updateOption(option.id, 'maxSelections', Math.min(Math.max(1, option.choices.length), option.maxSelections + 1))}
                          aria-label="Increase max picks"
                        >
                          <IonIcon icon={add} className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--ion-text-color-secondary)] mb-1.5">Option Name</label>
                    <IonItem className="field-box">
                      <IonInput
                        value={option.name}
                        onIonChange={e => updateOption(option.id, 'name', e.detail.value!)}
                        placeholder="e.g., Choice of Drink"
                        maxlength={30}
                        className="text-sm"
                      />
                    </IonItem>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[var(--ion-text-color-secondary)]">Choices</span>
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={() => addChoice(option.id)}
                        style={{ '--color': 'var(--ion-color-primary)', fontSize: '11px', minHeight: '26px', height: '26px', margin: 0 }}
                      >
                        <IonIcon icon={addOutline} slot="start" className="text-xs" />
                        Add
                      </IonButton>
                    </div>
                    {option.choices.length === 0 ? (
                      <p className="text-[11px] sm:text-xs text-[var(--ion-text-color-secondary)] text-center py-3 italic">No choices yet — tap "Add" to create one</p>
                    ) : (
                      <div className="space-y-1.5">
                        {option.choices.map((choice, ci) => (
                          <div
                            key={choice.id}
                            className={`flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 min-h-[44px] rounded-lg border border-[var(--ion-border-color)] ${ci % 2 === 0 ? 'bg-[var(--ion-background-color)]/30' : ''}`}
                          >
                            <span className="text-[10px] sm:text-xs font-bold text-[var(--ion-text-color-secondary)] w-4 sm:w-5 text-center shrink-0">{ci + 1}.</span>
                            <IonItem className="ion-item-clean flex-1 min-w-0">
                              <IonInput
                                value={choice.name}
                                placeholder="Name"
                                maxlength={30}
                                onIonChange={e => updateChoice(option.id, choice.id, 'name', e.detail.value!)}
                                className="text-xs sm:text-sm"
                              />
                            </IonItem>
                            <span className="text-[10px] sm:text-xs text-[var(--ion-text-color-secondary)] shrink-0">₱</span>
                            <IonItem className="ion-item-clean w-16 sm:w-24 shrink-0">
                              <IonInput
                                type="text"
                                inputmode="decimal"
                                value={choice.price}
                                placeholder="0"
                                onIonChange={e => updateChoice(option.id, choice.id, 'price', sanitizeMoney(e.detail.value ?? ''))}
                                className="text-xs sm:text-sm text-right"
                              />
                            </IonItem>
                            <IonButton
                              fill="clear"
                              size="small"
                              onClick={() => removeChoice(option.id, choice.id)}
                              style={{ '--color': 'var(--ion-color-danger)', minHeight: '32px', height: '32px', width: '32px', margin: 0 }}
                              aria-label={`Remove choice ${choice.name || ci + 1}`}
                            >
                              <IonIcon icon={trashOutline} className="text-xs" />
                            </IonButton>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
      <button
        type="button"
        onClick={addOption}
        className="w-full min-h-[44px] rounded-xl border-2 border-dashed border-[var(--ion-color-primary)]/40 text-[var(--ion-color-primary)] font-semibold text-sm flex items-center justify-center gap-2 hover:border-[var(--ion-color-primary)] hover:bg-[var(--ion-color-primary)]/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ion-color-primary)] focus-visible:ring-offset-2"
      >
        <IonIcon icon={addOutline} className="text-base" />
        Add Group
      </button>
    </SectionCard>
  );
};

export default OptionsEditor;
