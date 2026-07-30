import React, { useState, useRef, useEffect } from 'react';
import {
  IonModal,
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonToggle,
  IonAlert,
  isPlatform,
} from '@ionic/react';
import {
  closeOutline,
  addOutline,
  trashOutline,
  cameraOutline,
  imageOutline,
  checkmarkCircle,
  cashOutline,
  listOutline,
  addCircleOutline,
  documentTextOutline,
  starOutline,
} from 'ionicons/icons';
import { MenuItem, MenuItemOption, OptionChoice, MenuItemAddOn } from '../../../types';

interface ProductEditorModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: MenuItem) => void;
  onDelete?: () => void;
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

const emptyAddOn = (): MenuItemAddOn => ({
  id: `addon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  price: 0,
});

const ProductEditorModal: React.FC<ProductEditorModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description || '');
  const [price, setPrice] = useState(item.price);
  const [category, setCategory] = useState(item.category);
  const [available, setAvailable] = useState(item.available);
  const [popular, setPopular] = useState(item.popular || false);
  const [image, setImage] = useState(item.image || '');
  const [options, setOptions] = useState<MenuItemOption[]>(item.options || []);
  const [addOns, setAddOns] = useState<MenuItemAddOn[]>(item.addOns || []);
  const [isMobile, setIsMobile] = useState(isPlatform('mobile') || window.innerWidth < 640);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const addOption = () => setOptions(prev => [...prev, emptyOption()]);
  const removeOption = (optId: string) => setOptions(prev => prev.filter(o => o.id !== optId));

  const updateOption = (optId: string, field: string, value: string | boolean | number) => {
    setOptions(prev => prev.map(o => o.id === optId ? { ...o, [field]: value } : o));
  };

  const addChoice = (optId: string) => {
    setOptions(prev => prev.map(o =>
      o.id === optId ? { ...o, choices: [...o.choices, emptyChoice()] } : o
    ));
  };

  const removeChoice = (optId: string, chId: string) => {
    setOptions(prev => prev.map(o =>
      o.id === optId ? { ...o, choices: o.choices.filter(c => c.id !== chId) } : o
    ));
  };

  const updateChoice = (optId: string, chId: string, field: string, value: string | number) => {
    setOptions(prev => prev.map(o =>
      o.id === optId ? {
        ...o,
        choices: o.choices.map(c => c.id === chId ? { ...c, [field]: value } : c),
      } : o
    ));
  };

  const addAddOn = () => setAddOns(prev => [...prev, emptyAddOn()]);
  const removeAddOn = (addOnId: string) => setAddOns(prev => prev.filter(a => a.id !== addOnId));

  const updateAddOn = (addOnId: string, field: string, value: string | number) => {
    setAddOns(prev => prev.map(a => a.id === addOnId ? { ...a, [field]: value } : a));
  };

  const isValid = name.trim() && price > 0;

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      ...item,
      name,
      description,
      price,
      category,
      available,
      popular,
      image,
      options: options.filter(o => o.name.trim()),
      addOns: addOns.filter(a => a.name.trim()),
    });
    onClose();
  };

  const handleDelete = () => setShowDeleteAlert(true);

  const confirmDelete = () => {
    onDelete?.();
    onClose();
  };

  const hasChanges = name !== item.name
    || description !== (item.description || '')
    || price !== item.price
    || category !== item.category
    || available !== item.available
    || popular !== (item.popular || false)
    || image !== (item.image || '');

  const SectionCard: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="mb-3 sm:mb-4 rounded-xl sm:rounded-2xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] overflow-hidden">
      <div className="flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-[var(--ion-border-color)] bg-[var(--ion-background-color)]/50">
        <IonIcon icon={icon} className="text-[var(--ion-color-primary)] text-sm sm:text-base shrink-0" />
        <span className="font-semibold text-xs sm:text-sm text-[var(--ion-text-color)]">{title}</span>
      </div>
      <div className="p-3 sm:p-5">
        {children}
      </div>
    </div>
  );

  const content = (
    <div className="min-h-full flex flex-col">
      <div className="flex-1">
        <div className="relative overflow-hidden">
          {image ? (
            <div className="relative w-full aspect-[3/1] sm:aspect-[4/1] overflow-hidden">
              <img
                src={image}
                alt="Product"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {name && (
                <h2 className="absolute bottom-2 sm:bottom-3 left-3 sm:left-5 text-white font-bold text-base sm:text-xl drop-shadow-lg">
                  {name}
                </h2>
              )}
              <button
                className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all z-10"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <IonIcon icon={cameraOutline} className="text-white text-sm sm:text-base" />
              </button>
            </div>
          ) : (
            <div
              className="relative w-full aspect-[3/1] sm:aspect-[4/1] flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--ion-border-color)]/30 transition-colors border-b border-[var(--ion-border-color)]"
              onClick={() => fileInputRef.current?.click()}
              style={{ background: 'var(--ion-background-color)' }}
            >
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-[var(--ion-color-primary)]/10 flex items-center justify-center mb-1.5 sm:mb-2">
                <IonIcon icon={imageOutline} className="text-[var(--ion-color-primary)] text-xl sm:text-2xl" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-[var(--ion-text-color-secondary)]">Tap to add product photo</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </div>
        <p className="text-[10px] text-[var(--ion-text-color-secondary)] opacity-60 px-3 sm:px-5 -mt-1 mb-1">Recommended: 600×600px square — shown in menu cards</p>

        <div className="p-3 sm:p-5 space-y-3 sm:space-y-4 pb-20 sm:pb-6">
          <SectionCard title="Details" icon={documentTextOutline}>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--ion-text-color-secondary)] mb-1.5">Product Name</label>
                <IonItem className="ion-item-clean">
                  <IonInput
                    value={name}
                    onIonChange={e => setName(e.detail.value!)}
                    placeholder="e.g., Beef Pares"
                    className="text-sm"
                  />
                </IonItem>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ion-text-color-secondary)] mb-1.5">Description</label>
                <IonItem className="ion-item-clean">
                  <IonTextarea
                    value={description}
                    onIonChange={e => setDescription(e.detail.value!)}
                    rows={2}
                    placeholder="Describe your product..."
                    className="text-sm"
                  />
                </IonItem>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Pricing & Category" icon={cashOutline}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--ion-text-color-secondary)] mb-1.5">Price (₱)</label>
                <IonItem className="ion-item-clean">
                  <IonInput
                    type="number"
                    value={price}
                    onIonChange={e => setPrice(Number(e.detail.value) || 0)}
                    placeholder="0.00"
                    className="text-sm"
                  />
                </IonItem>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ion-text-color-secondary)] mb-1.5">Category</label>
                <IonItem className="ion-item-clean">
                  <IonInput
                    value={category}
                    onIonChange={e => setCategory(e.detail.value!)}
                    placeholder="e.g., Main Course"
                    className="text-sm"
                  />
                </IonItem>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Status" icon={checkmarkCircle}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
              <div className="flex items-center justify-between sm:justify-start sm:gap-3 flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-[var(--ion-border-color)] bg-[var(--ion-background-color)]/50">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${available ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-sm font-medium text-[var(--ion-text-color)]">Available</span>
                </div>
                <IonToggle
                  checked={available}
                  onIonChange={e => setAvailable(e.detail.checked)}
                  style={{
                    '--background': 'var(--ion-border-color)',
                    '--background-checked': 'var(--ion-color-success)',
                    '--handle-background': '#fff',
                    '--handle-background-checked': '#fff',
                  } as React.CSSProperties & Record<string, string>}
                />
              </div>
              <div className="flex items-center justify-between sm:justify-start sm:gap-3 flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-[var(--ion-border-color)] bg-[var(--ion-background-color)]/50">
                <div className="flex items-center gap-2">
                  <IonIcon icon={starOutline} className={`text-sm ${popular ? 'text-yellow-500' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium text-[var(--ion-text-color)]">Popular</span>
                </div>
                <IonToggle
                  checked={popular}
                  onIonChange={e => setPopular(e.detail.checked)}
                  style={{
                    '--background': 'var(--ion-border-color)',
                    '--background-checked': 'var(--ion-color-warning)',
                    '--handle-background': '#fff',
                    '--handle-background-checked': '#fff',
                  } as React.CSSProperties & Record<string, string>}
                />
              </div>
            </div>
          </SectionCard>

          <div className="mb-3 sm:mb-4 rounded-xl sm:rounded-2xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-[var(--ion-border-color)] bg-[var(--ion-background-color)]/50">
              <div className="flex items-center gap-2">
                <IonIcon icon={listOutline} className="text-[var(--ion-color-primary)] text-sm sm:text-base shrink-0" />
                <span className="font-semibold text-xs sm:text-sm text-[var(--ion-text-color)]">Options</span>
                {options.length > 0 && (
                  <span className="text-[10px] sm:text-xs bg-[var(--ion-color-primary)]/10 text-[var(--ion-color-primary)] px-2 py-0.5 rounded-full font-medium">{options.length}</span>
                )}
              </div>
              <IonButton
                fill="clear"
                size="small"
                color="primary"
                style={{ fontSize: '12px' }}
              >
                <IonIcon icon={addCircleOutline} slot="start" />
                Add Group
              </IonButton>
            </div>
            <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
              {options.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--ion-background-color)] flex items-center justify-center mx-auto mb-2">
                    <IonIcon icon={addOutline} className="text-[var(--ion-text-color-secondary)] text-lg sm:text-xl" />
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--ion-text-color-secondary)]">No option groups yet</p>
                  <p className="text-[10px] sm:text-xs text-[var(--ion-text-color-secondary)] mt-1">Add choices like size, drink, or toppings</p>
                </div>
              ) : (
                options.map((option, oi) => (
                  <div
                    key={option.id}
                    className="rounded-lg sm:rounded-xl border border-[var(--ion-border-color)] overflow-hidden bg-[var(--ion-background-color)]/30"
                  >
                    <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--ion-color-primary)]/5 border-b border-[var(--ion-border-color)]">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[var(--ion-color-primary)] text-white text-[10px] sm:text-xs font-bold flex items-center justify-center shrink-0">
                          {oi + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[var(--ion-text-color)] truncate max-w-[120px] sm:max-w-[200px]">
                          {option.name || `Option ${oi + 1}`}
                        </span>
                        {option.required ? (
                          <span className="text-[10px] sm:text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 sm:px-2 py-0.5 rounded-full font-medium">Required</span>
                        ) : (
                          <span className="text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-700 text-[var(--ion-text-color-secondary)] px-1.5 sm:px-2 py-0.5 rounded-full font-medium">Optional</span>
                        )}
                      </div>
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={() => removeOption(option.id)}
                        style={{ '--color': 'var(--ion-color-danger)', minHeight: '28px', height: '28px' }}
                      >
                        <IonIcon icon={trashOutline} className="text-sm" />
                      </IonButton>
                    </div>

                    <div className="p-3 sm:p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--ion-border-color)] bg-[var(--ion-card-background)]">
                          <IonLabel className="text-xs font-medium text-[var(--ion-text-color-secondary)] shrink-0">Required</IonLabel>
                          <IonToggle
                            checked={option.required}
                            onIonChange={e => updateOption(option.id, 'required', e.detail.checked)}
                            style={{
                              '--background': 'var(--ion-border-color)',
                              '--background-checked': 'var(--ion-color-danger)',
                              '--handle-background': '#fff',
                              '--handle-background-checked': '#fff',
                  } as React.CSSProperties & Record<string, string>}
                />
              </div>
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--ion-border-color)] bg-[var(--ion-card-background)]">
                          <IonLabel className="text-xs font-medium text-[var(--ion-text-color-secondary)] shrink-0">Max picks</IonLabel>
                          <IonItem className="ion-item-clean flex-1">
                            <IonInput
                              type="number"
                              value={option.maxSelections}
                              onIonChange={e => updateOption(option.id, 'maxSelections', Number(e.detail.value) || 1)}
                              className="text-xs text-right"
                            />
                          </IonItem>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--ion-text-color-secondary)] mb-1.5">Option Name</label>
                        <IonItem className="ion-item-clean">
                          <IonInput
                            value={option.name}
                            onIonChange={e => updateOption(option.id, 'name', e.detail.value!)}
                            placeholder="e.g., Choice of Drink"
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
                            style={{ '--color': 'var(--ion-color-primary)', fontSize: '11px', minHeight: '26px', height: '26px' }}
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
                                className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg border border-[var(--ion-border-color)] ${ci % 2 === 0 ? 'bg-[var(--ion-background-color)]/30' : ''}`}
                              >
                                <span className="text-[10px] sm:text-xs font-bold text-[var(--ion-text-color-secondary)] w-4 sm:w-5 text-center shrink-0">{ci + 1}.</span>
                                <IonItem className="ion-item-clean flex-1 min-w-0">
                                  <IonInput
                                    value={choice.name}
                                    placeholder="Name"
                                    onIonChange={e => updateChoice(option.id, choice.id, 'name', e.detail.value!)}
                                    className="text-xs sm:text-sm"
                                  />
                                </IonItem>
                                <span className="text-[10px] sm:text-xs text-[var(--ion-text-color-secondary)] shrink-0">+₱</span>
                                <IonItem className="ion-item-clean w-16 sm:w-20 shrink-0">
                                  <IonInput
                                    type="number"
                                    value={choice.price}
                                    placeholder="0"
                                    onIonChange={e => updateChoice(option.id, choice.id, 'price', Number(e.detail.value) || 0)}
                                    className="text-xs sm:text-sm text-right"
                                  />
                                </IonItem>
                                <IonButton
                                  fill="clear"
                                  size="small"
                                  onClick={() => removeChoice(option.id, choice.id)}
                                  style={{ '--color': 'var(--ion-color-danger)', minHeight: '24px', height: '24px', width: '24px' }}
                                >
                                  <IonIcon icon={trashOutline} className="text-xs" />
                                </IonButton>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mb-3 sm:mb-4 rounded-xl sm:rounded-2xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-[var(--ion-border-color)] bg-[var(--ion-background-color)]/50">
              <div className="flex items-center gap-2">
                <IonIcon icon={addCircleOutline} className="text-emerald-500 text-sm sm:text-base shrink-0" />
                <span className="font-semibold text-xs sm:text-sm text-[var(--ion-text-color)]">Add-ons</span>
                {addOns.length > 0 && (
                  <span className="text-[10px] sm:text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">{addOns.length}</span>
                )}
              </div>
              <IonButton
                fill="clear"
                size="small"
                color="success"
                style={{ fontSize: '12px' }}
              >
                <IonIcon icon={addCircleOutline} slot="start" />
                Add Add-on
              </IonButton>
            </div>
            <div className="p-3 sm:p-5">
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
                      className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg border border-[var(--ion-border-color)] ${ai % 2 === 0 ? 'bg-[var(--ion-background-color)]/30' : ''}`}
                    >
                      <span className="text-[10px] sm:text-xs font-bold text-[var(--ion-text-color-secondary)] w-4 sm:w-5 text-center shrink-0">{ai + 1}.</span>
                      <IonItem className="ion-item-clean flex-1 min-w-0">
                        <IonInput
                          value={addOn.name}
                          placeholder="Add-on name"
                          onIonChange={e => updateAddOn(addOn.id, 'name', e.detail.value!)}
                          className="text-xs sm:text-sm"
                        />
                      </IonItem>
                      <span className="text-[10px] sm:text-xs text-[var(--ion-text-color-secondary)] shrink-0">₱</span>
                      <IonItem className="ion-item-clean w-16 sm:w-20 shrink-0">
                        <IonInput
                          type="number"
                          value={addOn.price}
                          placeholder="0"
                          onIonChange={e => updateAddOn(addOn.id, 'price', Number(e.detail.value) || 0)}
                          className="text-xs sm:text-sm text-right"
                        />
                      </IonItem>
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={() => removeAddOn(addOn.id)}
                        style={{ '--color': 'var(--ion-color-danger)', minHeight: '24px', height: '24px', width: '24px' }}
                      >
                        <IonIcon icon={trashOutline} className="text-xs" />
                      </IonButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!isMobile && (
            <div className="flex justify-between gap-3 pt-2">
              <div className="flex gap-2">
                {item.name && onDelete && (
                  <IonButton
                    fill="outline"
                    color="danger"
                    shape="round"
                    className="font-semibold text-sm min-h-[42px]"
                    onClick={handleDelete}
                  >
                    <IonIcon icon={trashOutline} slot="start" className="text-sm" />
                    Delete
                  </IonButton>
                )}
              </div>
              <div className="flex gap-3">
                <IonButton
                  fill="outline"
                  shape="round"
                  className="font-semibold text-sm min-h-[42px]"
                  onClick={onClose}
                >
                  Cancel
                </IonButton>
                <IonButton
                  shape="round"
                  className="font-semibold text-sm min-h-[42px]"
                  onClick={handleSave}
                  disabled={!isValid || (!hasChanges && !!item.name)}
                >
                  <IonIcon icon={checkmarkCircle} slot="start" className="text-sm" />
                  {item.name ? 'Save Product' : 'Create Product'}
                </IonButton>
              </div>
            </div>
          )}
        </div>
      </div>

      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-[var(--ion-card-background)] border-t border-[var(--ion-border-color)] z-50 flex gap-2">
          {item.name && onDelete && (
            <IonButton
              fill="outline"
              color="danger"
              shape="round"
              className="min-h-[48px] shrink-0 font-semibold"
              style={{ margin: 0, minWidth: '56px' }}
            >
              <IonIcon icon={trashOutline} />
            </IonButton>
          )}
          <IonButton
            expand="block"
            shape="round"
            className="min-h-[48px] font-bold"
            onClick={handleSave}
            disabled={!isValid || (!hasChanges && !!item.name)}
            style={{ margin: 0 }}
          >
            <IonIcon icon={checkmarkCircle} slot="start" />
            {item.name ? 'Save Changes' : 'Create Product'}
          </IonButton>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <IonPage className="product-editor-page">
        <IonHeader className="ion-no-border">
          <IonToolbar style={{ '--background': 'var(--ion-card-background)', '--border-width': 0 }}>
            <IonButtons slot="start">
              <IonButton onClick={onClose} style={{ '--color': 'var(--ion-text-color-secondary)' }}>
                <IonIcon icon={closeOutline} className="text-lg" />
              </IonButton>
            </IonButtons>
            <div className="flex items-center justify-center h-full">
              <span className="font-semibold text-sm text-[var(--ion-text-color)]">{item.name || 'New Product'}</span>
            </div>
            <IonButtons slot="end">
              <div className="w-10" />
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'var(--ion-background-color)' }} className="product-editor-content">
          {content}
        </IonContent>

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Delete Product"
          message="Delete this product? This cannot be undone."
          buttons={[
            { text: 'Cancel', role: 'cancel', handler: () => setShowDeleteAlert(false) },
            { text: 'Delete', role: 'destructive', handler: confirmDelete },
          ]}
        />
      </IonPage>
    );
  }

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      className="product-editor-modal"
      style={{
        '--max-width': 'min(680px, 92vw)',
        '--height': '90vh',
        '--border-radius': '20px',
        '--box-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      } as React.CSSProperties & Record<string, string>}
    >
      <IonHeader className="ion-no-border">
        <IonToolbar style={{
          '--background': 'var(--ion-color-primary)',
          '--border-width': 0,
          minHeight: '52px',
        }}>
          <IonButtons slot="start">
            <IonButton onClick={onClose} style={{ '--color': '#fff' }}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
          <div className="flex items-center justify-center h-full">
            <span className="font-semibold text-sm text-white">{item.name || 'New Product'}</span>
          </div>
          <IonButtons slot="end">
            <IonButton
              shape="round"
              className="font-semibold text-xs min-h-[32px]"
              onClick={handleSave}
              disabled={!isValid || (!hasChanges && !!item.name)}
              style={{ '--background': 'rgba(255,255,255,0.2)', '--color': '#fff', backdropFilter: 'blur(8px)' }}
            >
              <IonIcon icon={checkmarkCircle} slot="start" className="text-xs" />
              Save
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': 'var(--ion-background-color)' }} className="product-editor-content">
        {content}
      </IonContent>

      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Delete Product"
        message="Delete this product? This cannot be undone."
        buttons={[
          { text: 'Cancel', role: 'cancel', handler: () => setShowDeleteAlert(false) },
          { text: 'Delete', role: 'destructive', handler: confirmDelete },
        ]}
      />
    </IonModal>
  );
};

export default ProductEditorModal;
