import React, { useEffect, useState } from 'react';
import {
  IonButton,
  IonIcon,
} from '@ionic/react';
import { receiptOutline, bicycleOutline, checkmarkCircle } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

import { useOrders } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { subscribeCustomerOrders } from '../../services/orderService';
import { Order } from '../../types';
import { hasReviewedOrder } from '../../services/reviewService';
import ReviewModal from '../../components/Reviews/ReviewModal';
import PageLoader from '../../components/PageLoader';
import { formatOrderCode, formatOrderDateTime, toDate } from '../../utils/orderFormat';

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  pending: { color: '#F59E0B', label: 'Pending' },
  accepted: { color: '#3B82F6', label: 'Accepted' },
  preparing: { color: '#7C3AED', label: 'Preparing' },
  ready: { color: '#10B981', label: 'Ready' },
  delivering: { color: '#8B5CF6', label: 'Delivering' },
  delivered: { color: '#6B7280', label: 'Delivered' },
  cancelled: { color: '#EF4444', label: 'Cancelled' },
};

const getBadgeColor = (status: string) => {
  return STATUS_BADGE[status]?.color || '#9CA3AF';
};

const UserOrders: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const { orders: localOrders } = useOrders();
  const [firestoreOrders, setFirestoreOrders] = useState<Order[]>([]);
  const [loadingFirestore, setLoadingFirestore] = useState(true);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewedOrders, setReviewedOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) { setLoadingFirestore(false); return; }
    const unsub = subscribeCustomerOrders(user.id, orders => {
      setFirestoreOrders(orders);
      setLoadingFirestore(false);
    });
    return () => unsub();
  }, [user]);

  const mergedOrders = React.useMemo(() => {
    const seen = new Set<string>();
    const result = [...firestoreOrders];
    result.forEach(o => seen.add(o.id));
    for (const o of localOrders) {
      if (!seen.has(o.id)) {
        result.push(o);
        seen.add(o.id);
      }
    }
    result.sort((a, b) => {
      const aActive = a.status !== 'delivered' && a.status !== 'cancelled';
      const bActive = b.status !== 'delivered' && b.status !== 'cancelled';
      if (aActive !== bActive) return aActive ? -1 : 1;
      return (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0);
    });
    return result;
  }, [firestoreOrders, localOrders]);

  // Track which delivered orders already have a review (only-review-once)
  const refreshReviewed = async (orderId: string) => {
    const already = await hasReviewedOrder(orderId);
    setReviewedOrders(prev => ({ ...prev, [orderId]: already }));
  };

  useEffect(() => {
    const delivered = mergedOrders.filter(o => o.status === 'delivered');
    if (delivered.length === 0) return;
    let cancelled = false;
    (async () => {
      const result: Record<string, boolean> = {};
      for (const o of delivered) {
        try { result[o.id] = await hasReviewedOrder(o.id); } catch { result[o.id] = false; }
      }
      if (!cancelled) setReviewedOrders(prev => ({ ...prev, ...result }));
    })();
    return () => { cancelled = true; };
  }, [mergedOrders]);

  if (loadingFirestore) {
    return <PageLoader message="Loading your orders..." />;
  }

  return (
    <div className="w-full flex-1 md:pt-8">
      <div className="page-container flex-1 flex flex-col pb-10 space-y-3 sm:space-y-4">
        <div>
          <h2 className="m-0 text-xl xs:text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--ion-text-color)]">
            My Orders
          </h2>
        </div>

        {mergedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
            <div className="w-30 h-30 bg-[var(--ion-card-background)] border-2 border-[var(--ion-border-color)] rounded-full flex items-center justify-center mb-6">
              <IonIcon icon={receiptOutline} className="text-5xl text-[var(--ion-color-primary)]" />
            </div>
            <h2 className="m-0 mb-2 font-bold text-[var(--ion-text-color)]">You don't have any orders yet</h2>
            <p className="m-0 text-[var(--ion-text-color-secondary)]">Place an order to see it here!</p>
            <IonButton shape="round" className="mt-6" onClick={() => history.push('/customer/home')}>
              Browse Stalls
            </IonButton>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {mergedOrders.map(order => {
              return (
                <div
                  key={order.id}
                  onClick={() => history.push('/customer/order-tracking', { order })}
                  className="bg-[var(--ion-card-background)] p-4 rounded-xl border border-[var(--ion-border-color)] cursor-pointer transition-transform duration-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 mr-2">
                      <span className="font-bold text-sm text-[var(--ion-text-color)] block truncate">
                        {order.stallName || 'Order'}
                      </span>
                      <span className="text-xs text-[var(--ion-text-color-secondary)] block mt-0.5">
                        Order {formatOrderCode(order.id)}
                      </span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0" style={{ backgroundColor: getBadgeColor(order.status) + '1A', color: getBadgeColor(order.status), border: '1px solid ' + getBadgeColor(order.status) + '30' }}>{STATUS_BADGE[order.status]?.label || order.status}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="m-0 mb-0.5 text-sm text-[var(--ion-text-color-secondary)]">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </p>
                      <p className="m-0 text-xs text-[var(--ion-text-color-secondary)]">
                        {formatOrderDateTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.status === 'delivered' && (
                        reviewedOrders[order.id] ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#10B981] shrink-0">
                            <IonIcon icon={checkmarkCircle} />
                            Reviewed
                          </span>
                        ) : (
                          <IonButton size="small" fill="clear" color="secondary" onClick={e => { e.stopPropagation(); setReviewOrder(order); }}>
                            Review
                          </IonButton>
                        )
                      )}
                      <span className="text-base font-bold text-[var(--ion-color-primary)]">
                        ₱{order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {order.riderId && order.riderName && (
                    <div className="mt-2 pt-2 border-t border-[var(--ion-border-color)] flex items-center gap-1.5 text-xs text-[var(--ion-text-color-secondary)]">
                      <IonIcon icon={bicycleOutline} className="text-sm text-[var(--ion-color-primary)] shrink-0" />
                      <span className="truncate">{order.riderName}</span>
                      {order.riderPlate && (
                        <span className="truncate font-medium">· {order.riderPlate}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ReviewModal order={reviewOrder} isOpen={!!reviewOrder} onClose={() => { if (reviewOrder) refreshReviewed(reviewOrder.id); setReviewOrder(null); }} />
    </div>
  );
};

export default UserOrders;
