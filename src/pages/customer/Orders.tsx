import React, { useEffect, useState } from 'react';
import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonBadge,
} from '@ionic/react';
import { receiptOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

import { useOrders } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';
import { Order } from '../../types';

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
  return (STATUS_BADGE[status]?.color || '#9CA3AF') as any;
};

const UserOrders: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const { orders: localOrders } = useOrders();
  const [firestoreOrders, setFirestoreOrders] = useState<Order[]>([]);
  const [loadingFirestore, setLoadingFirestore] = useState(true);

  useEffect(() => {
    if (!user) { setLoadingFirestore(false); return; }
    const q = query(collection(db, 'orders'), where('userId', '==', user.id));
    const unsub = onSnapshot(q, snapshot => {
      const items: Order[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as Order);
      });
      setFirestoreOrders(items);
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
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return result;
  }, [firestoreOrders, localOrders]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex-1 md:pt-8">
      <div className="page-container flex-1 flex flex-col pb-10">
        <div className="pt-5 pb-4">
          <h2 className="m-0 text-[28px] font-bold text-[var(--ion-text-color)]">
            My Orders
          </h2>
        </div>

        {loadingFirestore ? (
          <div className="flex items-center justify-center flex-1">
            <IonSpinner />
          </div>
        ) : mergedOrders.length === 0 ? (
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
          <div>
            {mergedOrders.map(order => {
              return (
                <div
                  key={order.id}
                  onClick={() => history.push('/customer/order-tracking', { order })}
                  className="bg-[var(--ion-card-background)] p-4 rounded-xl border border-[var(--ion-border-color)] mb-4 cursor-pointer transition-transform duration-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-[var(--ion-text-color)]">
                      {order.id}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: getBadgeColor(order.status) + '1A', color: getBadgeColor(order.status), border: '1px solid ' + getBadgeColor(order.status) + '30' }}>{STATUS_BADGE[order.status]?.label || order.status}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="m-0 mb-0.5 text-sm text-[var(--ion-text-color-secondary)]">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        {order.stallName ? ` from ${order.stallName}` : ''}
                      </p>
                      <p className="m-0 text-xs text-[var(--ion-text-color-secondary)]">
                        {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.status === 'delivered' && (
                        <IonButton size="small" fill="clear" color="secondary" onClick={e => { e.stopPropagation(); history.push(`/customer/review/${order.id}`, { order }); }}>
                          Review
                        </IonButton>
                      )}
                      <span className="text-base font-bold text-[var(--ion-color-primary)]">
                        ₱{order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserOrders;
