import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonToast,
  IonModal,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonTitle,
  IonContent,
} from '@ionic/react';
import { checkmarkCircleOutline, closeOutline, storefrontOutline, personOutline, callOutline, locationOutline, cashOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subscribeAvailableOrders, subscribeRiderOrders, updateOrderStatus } from '../../services/orderService';
import type { Order } from '../../types';
import OrderCard from '../../components/Rider/OrderCard';
import RiderActionButton from '../../components/Rider/RiderActionButton';
import RiderPageHeader from '../../components/Rider/RiderPageHeader';
import SegmentTabs from '../../components/Rider/SegmentTabs';
import EmptyState from '../../components/Rider/EmptyState';
import { useDeclinedOrders } from '../../hooks/useDeclinedOrders';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ready: { label: 'Ready', color: '#F59E0B' },
  delivering: { label: 'Delivering', color: 'var(--ion-color-primary)' },
  delivered: { label: 'Delivered', color: '#10B981' },
};

const RiderOrders: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('available');
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [riderOrders, setRiderOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);

  const { declineOrder, filterDeclined } = useDeclinedOrders(user?.id);

  useEffect(() => {
    const unsubAvailable = subscribeAvailableOrders(orders => {
      setAvailableOrders(orders);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('Failed to fetch available orders:', err);
      setError('Could not load available orders. Check permissions.');
      setLoading(false);
    });
    return () => unsubAvailable();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubRider = subscribeRiderOrders(user.id, orders => {
      setRiderOrders(orders);
    });
    return () => unsubRider();
  }, [user]);

  const activeOrders = riderOrders.filter(o => o.status === 'delivering');
  const completedOrders = riderOrders.filter(o => o.status === 'delivered');
  const filteredAvailable = filterDeclined(availableOrders);

  const handleAccept = async (order: Order) => {
    if (!user) return;
    setClaimingId(order.id);
    try {
      await updateOrderStatus(order.id, { status: 'delivering', riderId: user.id });
      setToastMessage('Order accepted');
      setShowToast(true);
    } catch (err) {
      console.error('Failed to accept order:', err);
      setToastMessage('Failed to accept order');
      setShowToast(true);
    } finally {
      setClaimingId(null);
    }
  };

  const handleDelivered = async (order: Order) => {
    setDeliveringId(order.id);
    try {
      await updateOrderStatus(order.id, { status: 'delivered', completedAt: new Date() });
      setToastMessage('Order marked as delivered');
      setShowToast(true);
    } catch (err) {
      console.error('Failed to mark delivered:', err);
      setToastMessage('Failed to mark delivered');
      setShowToast(true);
    } finally {
      setDeliveringId(null);
    }
  };

  const handleDecline = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    declineOrder(orderId);
    setToastMessage('Order hidden');
    setShowToast(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <IonSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="warning-outline"
        title={error}
        subtitle="Check the console for details"
      />
    );
  }

  const tabs = [
    { value: 'available', label: 'Available', count: filteredAvailable.length },
    { value: 'active', label: 'Active', count: activeOrders.length },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <>
      <div className="w-full flex-1 md:pt-8 pb-10 flex flex-col space-y-3 sm:space-y-4">
        <RiderPageHeader title="Orders" subtitle="Manage your deliveries" />
        <SegmentTabs tabs={tabs} selected={selectedTab} onChange={setSelectedTab} />

      {selectedTab === 'available' && (
        <div className="space-y-3 sm:space-y-4">
          {filteredAvailable.length === 0 ? (
            <EmptyState
              icon="cube-outline"
              title="No available orders"
              subtitle="Waiting for vendors to mark orders as ready"
            />
          ) : (
            filteredAvailable.map(order => (
              <div key={order.id} onClick={() => setDetailsOrder(order)} className="cursor-pointer">
                <OrderCard
                  order={order}
                  badge={{ label: STATUS_CONFIG[order.status]?.label || order.status, color: STATUS_CONFIG[order.status]?.color || '#9CA3AF' }}
                  actions={
                    <div className="flex gap-2">
                      <RiderActionButton variant="decline" className="flex-1" onClick={(e) => handleDecline(e, order.id)}>
                        Decline
                      </RiderActionButton>
                      <RiderActionButton variant="accept" className="flex-[2]" loading={claimingId === order.id} onClick={() => handleAccept(order)}>
                        Accept
                      </RiderActionButton>
                    </div>
                  }
                />
              </div>
            ))
          )}
        </div>
      )}

      {selectedTab === 'active' && (
        <div className="space-y-3 sm:space-y-4">
          {activeOrders.length === 0 ? (
            <EmptyState
              icon="bicycle-outline"
              title="No active deliveries"
              subtitle="Accept an available order to start delivering"
            />
          ) : (
            activeOrders.map(order => (
              <div key={order.id} onClick={() => history.push(`/rider/delivery/${order.id}`, { order })} className="cursor-pointer">
                <OrderCard
                  order={order}
                  badge={{ label: STATUS_CONFIG[order.status]?.label || order.status, color: STATUS_CONFIG[order.status]?.color || '#9CA3AF' }}
                  actions={
                    <div className="flex gap-2">
                      <RiderActionButton variant="primary" className="flex-1" onClick={(e) => { e.stopPropagation(); history.push(`/rider/delivery/${order.id}`, { order }); }}>
                        Open Delivery
                      </RiderActionButton>
                      <RiderActionButton variant="accept" className="flex-1" loading={deliveringId === order.id} onClick={(e) => { e.stopPropagation(); handleDelivered(order); }}>
                        {deliveringId === order.id ? 'Marking...' : 'Mark Delivered'}
                      </RiderActionButton>
                    </div>
                  }
                />
              </div>
            ))
          )}
        </div>
      )}

      {selectedTab === 'completed' && (
        <div className="space-y-3 sm:space-y-4">
          {completedOrders.length === 0 ? (
            <EmptyState
              icon="flag-outline"
              title="No completed deliveries"
              subtitle="Your delivery history will appear here"
            />
          ) : (
            completedOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                badge={{ label: STATUS_CONFIG[order.status]?.label || order.status, color: STATUS_CONFIG[order.status]?.color || '#9CA3AF' }}
                actions={
                  <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)]">
                    <span className="text-xs text-[var(--ion-text-color-secondary)]">
                      Delivered at {order.completedAt ? new Date(order.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </span>
                    <span className="text-sm font-bold text-[var(--ion-color-primary)]">
                      <IonIcon icon={cashOutline} className="mr-1 align-middle" />
                      ₱{order.total?.toFixed(2)}
                    </span>
                  </div>
                }
              />
            ))
          )}
        </div>
      )}

      </div>

      <IonModal isOpen={!!detailsOrder} onDidDismiss={() => setDetailsOrder(null)}>
        <IonHeader className="ion-no-border">
          <IonToolbar style={{ '--background': 'var(--ion-card-background)' }}>
            <IonButtons slot="start">
              <IonButton onClick={() => setDetailsOrder(null)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle>Order Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'var(--ion-background-color)' }}>
          {detailsOrder && (
            <div className="p-4">
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-[var(--ion-border-color)]">
                <div>
                  <h2 className="m-0 text-lg font-bold text-[var(--ion-text-color)]">
                    <IonIcon icon={storefrontOutline} className="align-middle mr-1.5" />
                    {detailsOrder.stallName || 'Stall'}
                  </h2>
                  <p className="m-0 mt-1 text-xs text-[var(--ion-text-color-secondary)]">
                    {detailsOrder.items.length} item(s) · ₱{detailsOrder.total.toFixed(2)}
                  </p>
                </div>
                <span className="text-xs text-[var(--ion-text-color-secondary)]">#{detailsOrder.id.slice(-5)}</span>
              </div>

              {detailsOrder.customerName && (
                <div className="mb-4 pb-3 border-b border-[var(--ion-border-color)]">
                  <p className="m-0 mb-2 text-xs font-bold text-[var(--ion-text-color-secondary)] uppercase tracking-[0.3px]">
                    <IonIcon icon={personOutline} className="align-middle mr-1" />
                    Customer
                  </p>
                  <p className="m-0 text-sm font-semibold text-[var(--ion-text-color)]">{detailsOrder.customerName}</p>
                  {detailsOrder.customerPhone && (
                    <p className="m-0 mt-1 text-xs text-[var(--ion-text-color-secondary)]">
                      <IonIcon icon={callOutline} className="align-middle mr-1" />
                      {detailsOrder.customerPhone}
                    </p>
                  )}
                  {detailsOrder.deliveryAddress && (
                    <p className="m-0 mt-1 text-xs text-[var(--ion-text-color-secondary)]">
                      <IonIcon icon={locationOutline} className="align-middle mr-1" />
                      {detailsOrder.deliveryAddress}
                    </p>
                  )}
                </div>
              )}

              <div className="mb-4">
                <p className="m-0 mb-2 text-xs font-bold text-[var(--ion-text-color-secondary)] uppercase tracking-[0.3px]">Items</p>
                {detailsOrder.items.map((item, i) => (
                  <div key={i} className="p-3 bg-[var(--ion-card-background)] rounded-xl mb-2 border border-[var(--ion-border-color)]">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-semibold text-[var(--ion-text-color)] flex-1">{item.name}</span>
                      <span className="text-sm font-semibold text-[var(--ion-text-color-secondary)] mx-3">x{item.quantity}</span>
                      <span className="text-sm font-bold text-[var(--ion-text-color)]">₱{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    {item.selectedOptions?.map(opt => (
                      <p key={opt.optionId} className="mt-0.5 ml-3 text-xs text-[var(--ion-text-color-secondary)]">{opt.choiceName}</p>
                    ))}
                    {item.selectedAddOns?.map(addon => (
                      <p key={addon.addOnId} className="mt-0.5 ml-3 text-xs text-[var(--ion-text-color-secondary)]">+ {addon.name}</p>
                    ))}
                    {item.specialInstructions && (
                      <p className="mt-1.5 text-xs italic text-[var(--ion-text-color-secondary)] border-t border-dashed border-[var(--ion-border-color)] pt-1.5">
                        📝 {item.specialInstructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <RiderActionButton
                variant="accept"
                expand="block"
                loading={claimingId === detailsOrder.id}
                onClick={(e) => { setDetailsOrder(null); handleAccept(detailsOrder); }}
              >
                Accept Order
              </RiderActionButton>
            </div>
          )}
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showToast}
        message={toastMessage}
        duration={2000}
        onDidDismiss={() => setShowToast(false)}
        position="bottom"
      />
    </>
  );
};

export default RiderOrders;
