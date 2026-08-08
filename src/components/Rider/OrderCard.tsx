import React from 'react';
import { IonIcon } from '@ionic/react';
import { storefrontOutline, personOutline, navigateOutline } from 'ionicons/icons';
import type { Order } from '../../types';
import { formatOrderCode, formatOrderDateTime } from '../../utils/orderFormat';

interface Props {
  order: Order;
  pickupLabel?: string;
  dropoffLabel?: string;
  distanceKm?: number | null;
  feeAmount?: number;
  badge?: { label: string; color: string } | null;
  actions?: React.ReactNode;
  onPress?: () => void;
}

const OrderCard: React.FC<Props> = ({
  order,
  pickupLabel,
  dropoffLabel,
  distanceKm,
  feeAmount,
  badge,
  actions,
  onPress,
}) => (
  <div
    className="rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] overflow-hidden"
    onClick={onPress}
    style={onPress ? { cursor: 'pointer' } : undefined}
  >
    <div className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="min-w-0 flex-1 mr-2">
          <h3 className="m-0 mb-1 text-sm font-bold text-[var(--ion-text-color)] truncate">
            <IonIcon icon={storefrontOutline} className="mr-1 align-middle" />
            {pickupLabel || order.stallName || 'Stall'}
          </h3>
          <p className="m-0 text-xs text-[var(--ion-text-color-secondary)]">
            <IonIcon icon={personOutline} className="mr-1 align-middle" />
            {dropoffLabel || order.customerName || 'Customer'}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {badge ? (
            <span
              className="inline-block text-xs font-bold text-white px-2 py-0.5 rounded-full"
              style={{ background: badge.color }}
            >
              {badge.label}
            </span>
          ) : null}
          <p className="m-0 mt-1 text-sm font-bold text-[var(--ion-color-primary)]">
            ₱{(feeAmount ?? order.total ?? 0).toFixed(2)}
          </p>
        </div>
      </div>

      {order.deliveryAddress && (
        <div className="flex items-center gap-2 mb-3 text-xs text-[var(--ion-text-color-secondary)]">
          <IonIcon icon={navigateOutline} className="text-sm shrink-0" />
          <span className="truncate">{order.deliveryAddress}</span>
        </div>
      )}

      {distanceKm != null && (
        <div className="flex items-center gap-2 mb-3 text-xs text-[var(--ion-text-color-secondary)]">
          <IonIcon icon={navigateOutline} className="text-sm shrink-0" />
          <span>{distanceKm.toFixed(1)} km away</span>
        </div>
      )}

      {(order.id || order.createdAt) && (
        <div className="flex items-center justify-between gap-2 mb-3 pt-3 border-t border-[var(--ion-border-color)] text-xs text-[var(--ion-text-color-secondary)]">
          <span className="font-mono font-medium">{formatOrderCode(order.id)}</span>
          <span>{formatOrderDateTime(order.createdAt)}</span>
        </div>
      )}

      {actions}
    </div>
  </div>
);

export default OrderCard;
