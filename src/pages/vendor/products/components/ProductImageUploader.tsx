import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { cameraOutline, imageOutline, trashOutline } from 'ionicons/icons';

interface ProductImageUploaderProps {
  image: string;
  name: string;
  error?: string | null;
  onPick: () => void;
  onFile: (file: File) => void;
  onRemove?: () => void;
}

const pill = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ion-color-primary)] focus-visible:ring-offset-2';

const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({ image, name, error, onPick, onFile, onRemove }) => {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className="relative"
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
    >
      {image ? (
        <>
          <div className="relative md:hidden aspect-square w-full max-w-[260px] mx-auto overflow-hidden rounded-2xl shadow-xl">
            <img
              src={image}
              alt="Product"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {name && (
              <h2 className="absolute bottom-2 sm:bottom-3 left-3 sm:left-5 right-3 sm:right-5 text-white font-bold text-base sm:text-xl drop-shadow-lg truncate">
                {name}
              </h2>
            )}
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center gap-2 z-10">
              {onRemove && (
                <button
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[var(--ion-color-danger)] backdrop-blur-sm flex items-center justify-center transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ion-color-danger)] focus-visible:ring-offset-2"
                  onClick={onRemove}
                  type="button"
                  aria-label="Remove photo"
                >
                  <IonIcon icon={trashOutline} className="text-sm sm:text-base" />
                </button>
              )}
              <button
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[var(--ion-color-primary)] backdrop-blur-sm flex items-center justify-center transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ion-color-primary)] focus-visible:ring-offset-2"
                onClick={onPick}
                type="button"
                aria-label="Change photo"
              >
                <IonIcon icon={cameraOutline} className="text-sm sm:text-base" />
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 rounded-2xl border border-[var(--ion-border-color)] bg-[var(--ion-background-color)]/40 p-3 shadow-sm">
            <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-[var(--ion-card-background)]">
              <img src={image} alt="Product" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-sm font-semibold text-[var(--ion-text-color)] truncate">{name || 'Product photo'}</p>
              <p className="m-0 text-[11px] text-[var(--ion-text-color-secondary)] mt-0.5">Cropped to a perfect 300×300px square — shown in your menu cards</p>
              <div className="flex items-center gap-2 mt-2.5">
                <button type="button" onClick={onPick} className={`${pill} bg-[var(--ion-color-primary)]/10 text-[var(--ion-color-primary)] hover:bg-[var(--ion-color-primary)]/20`}>
                  <IonIcon icon={cameraOutline} className="text-sm" />
                  Change
                </button>
                {onRemove && (
                  <button type="button" onClick={onRemove} className={`${pill} bg-[var(--ion-color-danger)]/10 text-[var(--ion-color-danger)] hover:bg-[var(--ion-color-danger)]/20`}>
                    <IonIcon icon={trashOutline} className="text-sm" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <button
          type="button"
          className={`relative w-full flex flex-col items-center justify-center aspect-square md:aspect-auto md:flex-row md:items-center md:gap-5 md:min-h-[132px] rounded-2xl border-2 border-dashed cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ion-color-primary)] focus-visible:ring-offset-2 ${
            dragging
              ? 'border-[var(--ion-color-primary)] bg-[var(--ion-color-primary)]/10'
              : error
                ? 'border-[var(--ion-color-danger)] bg-[var(--ion-color-danger)]/5'
                : 'border-[var(--ion-border-color)] hover:border-[var(--ion-color-primary)]'
          }`}
          onClick={onPick}
          style={{ background: dragging ? undefined : 'var(--ion-background-color)' }}
        >
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full text-[var(--ion-color-primary)] flex items-center justify-center mb-2 sm:mb-3 md:mb-0 md:shrink-0 ${error ? 'bg-[var(--ion-color-danger)]/10 text-[var(--ion-color-danger)]' : 'bg-[var(--ion-color-primary)]/10'}`}>
            <IonIcon icon={imageOutline} className="text-2xl sm:text-3xl" />
          </div>
          <div className="text-center md:text-left min-w-0">
            <span className="block text-sm font-semibold text-[var(--ion-text-color)]">{dragging ? 'Drop it here!' : 'Add a product photo'}</span>
            <span className="block text-xs text-[var(--ion-text-color-secondary)] mt-1">Click to browse, drop an image, or paste (⌘V)</span>
            {error && (
              <span className="block text-[11px] text-[var(--ion-color-danger)] mt-2 font-medium">{error}</span>
            )}
          </div>
        </button>
      )}
      {image && (
        <p className="md:hidden text-[11px] text-center text-[var(--ion-text-color-secondary)] mt-2 max-w-[260px] mx-auto">Cropped to a perfect 300×300px square — shown in your menu cards</p>
      )}
      {!image && (
        <p className="text-[11px] text-center md:text-left text-[var(--ion-text-color-secondary)] mt-2">Cropped to a perfect 300×300px square — shown in your menu cards</p>
      )}
    </div>
  );
};

export default ProductImageUploader;
