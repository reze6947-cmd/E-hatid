import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonButton,
  IonIcon,
  IonContent,
  IonItem,
  IonInput,
  IonTextarea,
  IonToggle,
  IonAlert,
  IonSpinner,
} from '@ionic/react';
import {
  closeOutline,
  checkmarkCircle,
  starOutline,
  trashOutline,
  copyOutline,
} from 'ionicons/icons';
import { MenuItem, MenuItemOption, MenuItemAddOn } from '../../../../types';
import { sanitizeMoney, isImageFile, isImageTooLarge, readFileAsDataURL, MAX_IMAGE_SIZE_MB } from '../utils';
import { useIsMobile } from '../hooks/useIsMobile';
import SectionCard from './SectionCard';
import ProductImageUploader from './ProductImageUploader';
import OptionsEditor from './OptionsEditor';
import AddOnsEditor from './AddOnsEditor';

const ProductImageCropper = React.lazy(() => import('./ProductImageCropper'));

interface ProductEditorModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: MenuItem) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  categorySuggestions?: string[];
}

const normalizeOptions = (list: MenuItemOption[]) => JSON.stringify(list.filter(o => o.name.trim()));
const normalizeAddOns = (list: MenuItemAddOn[]) => JSON.stringify(list.filter(a => a.name.trim()));

type IonStyle = React.CSSProperties & { [key: `--${string}`]: string };

const SECTIONS = [
  { id: 'details', label: 'Details', icon: 'text-outline' },
  { id: 'pricing', label: 'Pricing', icon: 'pricetag-outline' },
  { id: 'status', label: 'Status', icon: 'eye-outline' },
  { id: 'options', label: 'Options', icon: 'list-outline' },
  { id: 'addons', label: 'Add-ons', icon: 'add-circle-outline' },
];

const inputClasses = 'w-full h-11 px-3 text-sm rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] text-[var(--ion-text-color)] placeholder:text-[var(--ion-text-color-secondary)] outline-none focus:border-[var(--ion-color-primary)] focus:ring-2 focus:ring-[var(--ion-color-primary-tint)] transition-all';

const ProductEditorModal: React.FC<ProductEditorModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  categorySuggestions = [],
}) => {
  const isMobile = useIsMobile();
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description || '');
  const [price, setPrice] = useState(item.price);
  const [category, setCategory] = useState(item.category);
  const [available, setAvailable] = useState(item.available);
  const [popular, setPopular] = useState(item.popular || false);
  const [image, setImage] = useState(item.image || '');
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [options, setOptions] = useState<MenuItemOption[]>(item.options || []);
  const [addOns, setAddOns] = useState<MenuItemAddOn[]>(item.addOns || []);
  const [nameTouched, setNameTouched] = useState(false);
  const [priceTouched, setPriceTouched] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [activeSection, setActiveSection] = useState('details');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLIonInputElement>(null);

  const nameError = name.trim() === '' ? 'Product name is required' : null;
  const priceError = price <= 0 ? 'Enter a price greater than 0' : null;
  const isValid = !nameError && !priceError;

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => nameInputRef.current?.setFocus(), 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleFile = useCallback((file: File) => {
    if (!isImageFile(file)) {
      setImageError('Please choose an image file (JPG, PNG, or WebP).');
      return;
    }
    if (isImageTooLarge(file)) {
      setImageError(`Image is too large. Max size is ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }
    setImageError(null);
    readFileAsDataURL(file)
      .then(setCropSource)
      .catch(() => setImageError('Could not read that image. Try another file.'));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onPaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files?.[0];
      if (file && isImageFile(file)) {
        e.preventDefault();
        handleFile(file);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [isOpen, handleFile]);

  useEffect(() => {
    if (!isOpen) return;
    const container = document.querySelector('.product-editor-scroll');
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { root: container, threshold: 0.15 },
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFile(file);
    e.target.value = '';
  };

  const removePhoto = () => {
    setImage('');
    setCropSource(null);
    setImageError(null);
  };

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

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hasChanges = name !== item.name
    || description !== (item.description || '')
    || price !== item.price
    || category !== item.category
    || available !== item.available
    || popular !== (item.popular || false)
    || image !== (item.image || '')
    || normalizeOptions(options) !== normalizeOptions(item.options || [])
    || normalizeAddOns(addOns) !== normalizeAddOns(item.addOns || []);

  const uploader = (
    <ProductImageUploader
      image={image}
      name={name}
      error={imageError}
      onPick={() => fileInputRef.current?.click()}
      onFile={handleFile}
      onRemove={image ? removePhoto : undefined}
    />
  );

  const sectionNav = (
    <nav aria-label="Product sections" className="hidden lg:block lg:sticky lg:top-0 rounded-2xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] p-2 shadow-sm">
      <p className="px-2 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--ion-text-color-secondary)]">Jump to</p>
      <div className="flex flex-col gap-0.5">
        {SECTIONS.map(s => {
          const active = activeSection === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollToSection(s.id)}
              aria-current={active ? 'true' : undefined}
              className={`flex items-center gap-2 px-2.5 h-9 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ion-color-primary)] ${
                active ? 'bg-[var(--ion-color-primary)]/10 text-[var(--ion-color-primary)]' : 'text-[var(--ion-text-color-secondary)] hover:bg-[var(--ion-border-color)]/40'
              }`}
            >
              <IonIcon icon={s.icon} className="text-sm" />
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );

  const content = (
    <div className="min-h-full flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageChange}
      />
      <div className="flex-1">
        {cropSource ? (
          <React.Suspense
            fallback={
              <div className="h-64 sm:h-80 bg-[var(--ion-card-background)] flex items-center justify-center">
                <IonSpinner name="crescent" />
              </div>
            }
          >
            <ProductImageCropper
              source={cropSource}
              onCancel={() => setCropSource(null)}
              onApply={dataUrl => { setImage(dataUrl); setCropSource(null); }}
            />
          </React.Suspense>
        ) : (
          <>
            <div className="p-3 sm:p-5 pb-6 lg:p-6 lg:grid lg:grid-cols-[220px_1fr] lg:gap-6 lg:items-start">
              {sectionNav}

              <div className="min-w-0 @container">
                {uploader}

                <div className="mt-3 sm:mt-4 grid grid-cols-1 gap-3 sm:gap-4 @3xl:grid-cols-2 @3xl:items-start">
                  <div className="min-w-0 space-y-3 sm:space-y-4">
                    <SectionCard id="details" title="Details">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-medium text-[var(--ion-text-color-secondary)]">Product Name</label>
                        <span className="text-[10px] tabular-nums text-[var(--ion-text-color-secondary)]">{name.length}/60</span>
                      </div>
                      <IonItem className="field-box">
                        <IonInput
                          ref={nameInputRef}
                          value={name}
                          onIonChange={e => setName(e.detail.value!)}
                          onIonBlur={() => setNameTouched(true)}
                          placeholder="e.g., Beef Pares"
                          maxlength={60}
                          className="text-sm"
                        />
                      </IonItem>
                      {nameTouched && nameError && (
                        <p className="text-[11px] text-[var(--ion-color-danger)] mt-1 font-medium">{nameError}</p>
                      )}
                      {!(nameTouched && nameError) && (
                        <p className="text-[11px] text-[var(--ion-text-color-secondary)] mt-1">This is what customers will see on your menu</p>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-medium text-[var(--ion-text-color-secondary)]">Description</label>
                        <span className="text-[10px] tabular-nums text-[var(--ion-text-color-secondary)]">{description.length}/200</span>
                      </div>
                      <IonItem className="field-box">
                        <IonTextarea
                          value={description}
                          onIonChange={e => setDescription(e.detail.value!)}
                          rows={2}
                          maxlength={200}
                          placeholder="Describe your product..."
                          className="text-sm"
                        />
                      </IonItem>
                      <p className="text-[11px] text-[var(--ion-text-color-secondary)] mt-1">Tell customers about the ingredients, taste, or serving size</p>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard id="pricing" title="Pricing & Category">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--ion-text-color-secondary)] mb-1.5">Price</label>
                      <IonItem className="field-box">
                        <span className="text-sm font-semibold text-[var(--ion-text-color-secondary)] pr-1">₱</span>
                        <IonInput
                          value={price}
                          inputmode="decimal"
                          type="text"
                          onIonChange={e => setPrice(sanitizeMoney(e.detail.value ?? ''))}
                          onIonBlur={() => setPriceTouched(true)}
                          placeholder="0.00"
                          className="text-sm"
                        />
                      </IonItem>
                      {priceTouched && priceError && (
                        <p className="text-[11px] text-[var(--ion-color-danger)] mt-1 font-medium">{priceError}</p>
                      )}
                      {!(priceTouched && priceError) && (
                        <p className="text-[11px] text-[var(--ion-text-color-secondary)] mt-1">Base price. Extra charges can be added in Options or Add-ons below</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--ion-text-color-secondary)] mb-1.5">Category</label>
                      <input
                        type="text"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        maxLength={40}
                        placeholder="e.g., Main Course"
                        list="product-categories"
                        aria-label="Category"
                        className={inputClasses}
                      />
                      <datalist id="product-categories">
                        {categorySuggestions.map(c => <option key={c} value={c} />)}
                      </datalist>
                      <p className="text-[11px] text-[var(--ion-text-color-secondary)] mt-1">Group similar items (e.g., Main Course, Drinks, Desserts)</p>
                    </div>
                  </div>
                    </SectionCard>
                  </div>
                  <div className="min-w-0 space-y-3 sm:space-y-4">
                    <SectionCard id="status" title="Status" className="mb-0 lg:mb-0">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                    <div className="flex items-center justify-between sm:justify-start sm:gap-3 flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-background-color)]/50 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${available ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-sm font-medium text-[var(--ion-text-color)]">Available</span>
                      </div>
                      <IonToggle
                        checked={available}
                        className="flex-shrink-0"
                        onIonChange={e => setAvailable(e.detail.checked)}
                        style={{
                          '--background': 'var(--ion-border-color)',
                          '--background-checked': 'var(--ion-color-success)',
                          '--handle-background': '#fff',
                          '--handle-background-checked': '#fff',
                        } as React.CSSProperties & Record<string, string>}
                      />
                    </div>
                    <div className="flex items-center justify-between sm:justify-start sm:gap-3 flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-background-color)]/50 shadow-sm">
                      <div className="flex items-center gap-2">
                        <IonIcon icon={starOutline} className={`text-sm ${popular ? 'text-yellow-500' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium text-[var(--ion-text-color)]">Popular</span>
                      </div>
                      <IonToggle
                        checked={popular}
                        className="flex-shrink-0"
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
                  <p className="text-[11px] text-[var(--ion-text-color-secondary)] mt-2">Toggle Available off to hide from menu · Toggle Popular on to highlight as bestseller</p>
                    </SectionCard>
                  </div>
                </div>

                <div className="mt-3 sm:mt-4 grid grid-cols-1 gap-3 sm:gap-4 @3xl:grid-cols-2 @3xl:items-start">
                  <OptionsEditor id="options" options={options} onChange={setOptions} />
                  <AddOnsEditor id="addons" addOns={addOns} onChange={setAddOns} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const desktopWidth = viewportWidth >= 1180 ? 'min(1180px, 94vw)' : 'min(680px, 92vw)';

  const modalStyle = isMobile
    ? {
        '--width': '100vw',
        '--height': '100dvh',
        '--border-radius': '0',
      } as React.CSSProperties & Record<string, string>
    : {
        '--width': desktopWidth,
        '--max-width': '94vw',
        '--height': 'min(88vh, 920px)',
        '--max-height': '92vh',
        '--border-radius': '20px',
        '--box-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      } as React.CSSProperties & Record<string, string>;

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      className="product-editor-modal"
      style={modalStyle}
    >
      <IonHeader className="ion-no-border">
        <div
          className="relative bg-[var(--ion-color-primary)]"
          style={{ minHeight: '56px', paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="relative grid grid-cols-[1fr_auto_1fr] items-center min-h-[52px] sm:min-h-[56px]">
            <div className="flex items-center">
              <IonButton
                onClick={onClose}
                aria-label="Close"
                style={{
                  '--color': '#fff',
                  '--background': 'rgba(0,0,0,0.2)',
                  '--background-hover': 'rgba(0,0,0,0.35)',
                  '--border-radius': '9999px',
                  '--padding-start': '0',
                  '--padding-end': '0',
                  width: '36px',
                  height: '36px',
                  margin: isMobile ? '6px 0 0 6px' : '0',
                } as IonStyle}
              >
                <IonIcon icon={closeOutline} />
              </IonButton>
            </div>
            <span className="text-center font-semibold text-sm sm:text-base text-white truncate max-w-[60vw]">{item.name || 'New Product'}</span>
            <div className="flex items-center justify-end">
              <div className="w-11" />
            </div>
          </div>
        </div>
      </IonHeader>

      <IonContent style={{ '--background': 'var(--ion-background-color)', '--overflow': 'hidden' }} className="product-editor-content">
        <div className="h-full overflow-y-auto product-editor-scroll">
          {content}
        </div>
      </IonContent>

      <div className="p-3 sm:p-4 md:p-5 bg-[var(--ion-card-background)] border-t border-[var(--ion-border-color)] flex items-center gap-2 w-full">
        {item.name && onDelete && (
          <IonButton
            fill="solid"
            color="danger"
            className="shrink-0"
            style={{ margin: 0, height: '48px', borderRadius: '9999px', '--padding-start': '16px', '--padding-end': '16px' } as IonStyle}
            onClick={handleDelete}
            aria-label="Delete product"
          >
            <IonIcon icon={trashOutline} />
            <span className="hidden sm:inline ml-1 text-sm font-semibold whitespace-nowrap">Delete</span>
          </IonButton>
        )}
        {onDuplicate && (
          <IonButton
            fill="outline"
            shape="round"
            className="shrink-0 min-h-[48px] font-semibold text-sm"
            onClick={onDuplicate}
            style={{ margin: 0 }}
            aria-label="Duplicate product"
          >
            <IonIcon icon={copyOutline} />
            <span className="hidden sm:inline ml-1 whitespace-nowrap">Duplicate</span>
          </IonButton>
        )}
        <IonButton
          fill="outline"
          shape="round"
          className="flex-1 min-w-0 min-h-[48px] font-semibold text-sm"
          onClick={onClose}
          style={{ margin: 0 }}
        >
          <span className="whitespace-nowrap">Cancel</span>
        </IonButton>
        <button
          onClick={handleSave}
          disabled={!isValid || (!hasChanges && !!item.name)}
          className="flex-[2] min-w-0 min-h-[48px] rounded-full bg-[var(--ion-color-primary)] hover:bg-[var(--ion-color-primary-shade)] text-white font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ion-color-primary)] focus-visible:ring-offset-2"
        >
          <IonIcon icon={checkmarkCircle} className="text-base" />
          {item.name ? 'Save Changes' : 'Create Product'}
        </button>
      </div>

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
