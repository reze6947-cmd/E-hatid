import React, { useCallback, useState } from 'react';
import { IonButton, IonIcon, IonLabel, IonToggle } from '@ionic/react';
import {
  createOutline,
  trashOutline,
  star,
  starOutline,
  listOutline,
  addCircleOutline,
  pricetagOutline,
  checkmark,
} from 'ionicons/icons';
import { MenuItem } from '../../../../types';
import { formatPrice } from '../utils';
import OptimizedImage from '../../../../components/OptimizedImage';

const toggleSizing = {
  '--background': 'var(--ion-border-color)',
  '--background-checked': 'var(--ion-color-primary)',
  '--handle-background': '#fff',
  '--handle-background-checked': '#fff',
  '--width': '44px',
  '--height': '24px',
  '--handle-width': '20px',
  '--handle-height': '20px',
} as React.CSSProperties & Record<string, string>;

const popularToggleSizing = {
  ...toggleSizing,
  '--background-checked': 'var(--ion-color-warning)',
} as React.CSSProperties & Record<string, string>;

const ProductImage: React.FC<{ product: MenuItem }> = ({ product }) => {
  const [failed, setFailed] = useState(false);
  if (product.image && !failed) {
    return (
      <OptimizedImage
        src={product.image}
        alt={product.name || 'Product'}
        width={300}
        height={300}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-[var(--ion-color-primary)]/10">
      <div className="w-14 h-14 rounded-full bg-[var(--ion-card-background)] shadow-sm flex items-center justify-center">
        <span className="text-2xl font-bold text-[var(--ion-color-primary)]">{product.name?.charAt(0)?.toUpperCase() || '?'}</span>
      </div>
    </div>
  );
};

interface ProductCardProps {
  product: MenuItem;
  selected: boolean;
  selecting: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (product: MenuItem) => void;
  onDelete: (id: string) => void;
  onToggleAvailable: (id: string) => void;
  onTogglePopular: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  selected,
  selecting,
  onToggleSelect,
  onEdit,
  onDelete,
  onToggleAvailable,
  onTogglePopular,
}) => {
  const handleClick = useCallback(() => {
    if (selecting) onToggleSelect(product.id);
    else onEdit(product);
  }, [selecting, onToggleSelect, onEdit, product]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  return (
    <div
      role={selecting ? 'checkbox' : 'button'}
      aria-checked={selecting ? selected : undefined}
      aria-label={product.name || 'Untitled product'}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`group cursor-pointer flex flex-col overflow-hidden rounded-2xl border bg-[var(--ion-card-background)] shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ion-color-primary)] ${
        selected && selecting
          ? 'border-[var(--ion-color-primary)] ring-2 ring-[var(--ion-color-primary)]/40'
          : 'border-[var(--ion-border-color)] hover:shadow-md hover:border-[var(--ion-color-primary)]/60'
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--ion-background-color)]">
        <ProductImage product={product} />
        {selecting && (
          <div className={`absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-sm transition-colors ${
            selected ? 'bg-[var(--ion-color-primary)] border-[var(--ion-color-primary)]' : 'bg-white/90 border-[var(--ion-border-color)]'
          }`}>
            {selected && <IonIcon icon={checkmark} className="text-white text-sm" />}
          </div>
        )}
        {!selecting && product.popular && (
          <span className="absolute top-2.5 left-2.5 z-10 bg-amber-500 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow">
            <IonIcon icon={star} className="text-[10px]" />
            Popular
          </span>
        )}
        {!selecting && !product.available && (
          <span className="absolute top-2.5 right-2.5 z-10 bg-black/60 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full shadow">
            Unavailable
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 p-3 sm:p-3.5 flex flex-col">
        <div className="min-w-0">
          <h3 className="m-0 font-semibold text-sm sm:text-[15px] text-[var(--ion-text-color)] line-clamp-2 leading-snug">
            {product.name || 'Untitled product'}
          </h3>
          {product.category && (
            <p className="m-0 text-xs text-[var(--ion-text-color-secondary)] mt-1 flex items-center gap-1">
              <IonIcon icon={pricetagOutline} className="text-[10px] shrink-0" />
              <span className="truncate">{product.category}</span>
            </p>
          )}
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="text-base sm:text-lg font-bold text-[var(--ion-color-primary)] tabular-nums">
            {formatPrice(product.price)}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {product.options && product.options.length > 0 && (
              <span className="text-[10px] sm:text-[11px] text-[var(--ion-text-color-secondary)] bg-[var(--ion-background-color)] px-2 py-0.5 rounded-full border border-[var(--ion-border-color)] flex items-center gap-1">
                <IonIcon icon={listOutline} className="text-[10px] text-[var(--ion-color-primary)] shrink-0" />
                {product.options.length}
              </span>
            )}
            {product.addOns && product.addOns.length > 0 && (
              <span className="text-[10px] sm:text-[11px] text-[var(--ion-text-color-secondary)] bg-[var(--ion-background-color)] px-2 py-0.5 rounded-full border border-[var(--ion-border-color)] flex items-center gap-1">
                <IonIcon icon={addCircleOutline} className="text-[10px] text-emerald-500 shrink-0" />
                {product.addOns.length}
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto pt-3">
          <div className={`grid grid-cols-2 gap-2 ${selecting ? 'opacity-40 pointer-events-none select-none' : ''}`}>
            <div className="flex items-center justify-between px-2.5 h-11 rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-background-color)]/50">
              <IonLabel className="text-[11px] sm:text-xs font-medium text-[var(--ion-text-color-secondary)]">Available</IonLabel>
              <IonToggle
                checked={product.available}
                onIonChange={() => onToggleAvailable(product.id)}
                onClick={e => e.stopPropagation()}
                style={toggleSizing}
              />
            </div>
            <div className="flex items-center justify-between px-2.5 h-11 rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-background-color)]/50">
              <IonLabel className="text-[11px] sm:text-xs font-medium text-[var(--ion-text-color-secondary)]">
                <IonIcon icon={product.popular ? star : starOutline} style={{ color: '#F59E0B', marginRight: 4, fontSize: 14, verticalAlign: '-2px' }} />
                Popular
              </IonLabel>
              <IonToggle
                checked={product.popular}
                onIonChange={() => onTogglePopular(product.id)}
                onClick={e => e.stopPropagation()}
                style={popularToggleSizing}
              />
            </div>
          </div>

          <div className={`mt-2.5 flex gap-2 ${selecting ? 'hidden' : ''}`}>
            <IonButton
              size="small"
              fill="outline"
              color="primary"
              className="flex-1 min-h-[40px] font-semibold"
              onClick={e => { e.stopPropagation(); onEdit(product); }}
            >
              <IonIcon icon={createOutline} slot="start" />
              Edit
            </IonButton>
            <IonButton
              size="small"
              fill="outline"
              color="danger"
              className="min-h-[40px] min-w-[44px]"
              onClick={e => { e.stopPropagation(); onDelete(product.id); }}
              aria-label={`Delete ${product.name || 'product'}`}
            >
              <IonIcon icon={trashOutline} />
            </IonButton>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
