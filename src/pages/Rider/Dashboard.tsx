import React, { useState, useEffect, useMemo } from 'react';
import {
  IonIcon,
} from '@ionic/react';
import { cashOutline, checkmarkCircleOutline, navigateOutline, bicycleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { subscribeAvailableOrders, subscribeRiderOrders } from '../../services/orderService';
import type { Order } from '../../types';
import OrderCard from '../../components/Rider/OrderCard';
import StatusToggle from '../../components/Rider/StatusToggle';
import StatCard from '../../components/Rider/StatCard';
import RiderActionButton from '../../components/Rider/RiderActionButton';
import RiderPageHeader from '../../components/Rider/RiderPageHeader';
import EmptyState from '../../components/Rider/EmptyState';
import { useDeclinedOrders } from '../../hooks/useDeclinedOrders';

const RiderDashboard: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [riderOrders, setRiderOrders] = useState<Order[]>([]);
  const [riderCoords, setRiderCoords] = useState<{lat: number; lng: number} | null>(null);

  const { declineOrder, filterDeclined } = useDeclinedOrders(user?.id);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      pos => setRiderCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const processedOrders = useMemo(() => {
    let sorted = [...availableOrders];
    if (riderCoords) {
      sorted = sorted
        .map(o => ({
          order: o,
          distance: (o.stallLatitude && o.stallLongitude)
            ? haversineKm(riderCoords.lat, riderCoords.lng, o.stallLatitude, o.stallLongitude)
            : Infinity,
        }))
        .sort((a, b) => {
          if (a.distance === Infinity && b.distance === Infinity) return 0;
          if (a.distance === Infinity) return 1;
          if (b.distance === Infinity) return -1;
          return a.distance - b.distance;
        })
        .map(x => x.order);
    } else {
      sorted = [...availableOrders].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    }
    return filterDeclined(sorted);
  }, [availableOrders, riderCoords, filterDeclined]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.id));
        if (snap.exists()) {
          setIsAvailable(snap.data()?.riderAvailable === true);
        }
      } catch (err) {
        console.error('Failed to load rider availability:', err);
      }
    };
    load();
  }, [user]);

  const toggleAvailability = async (checked: boolean) => {
    setIsAvailable(checked);
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { riderAvailable: checked });
    } catch (err) {
      console.error('Failed to save availability:', err);
      setIsAvailable(!checked);
    }
  };

  useEffect(() => {
    const unsub = subscribeAvailableOrders(orders => {
      setAvailableOrders(orders);
    }, (err) => {
      console.error('Failed to fetch available orders:', err);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeRiderOrders(user.id, orders => {
      setRiderOrders(orders);
    }, (err) => {
      console.error('Failed to fetch rider orders:', err);
    });
    return () => unsub();
  }, [user]);

  const activeDelivery = riderOrders.find(o => o.status === 'delivering');
  const todayDelivered = riderOrders.filter(o => {
    if (o.status !== 'delivered') return false;
    const d = new Date(o.completedAt || o.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const todayEarnings = todayDelivered.reduce((sum, o) => sum + (o.total || 0), 0);

  const handleDecline = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    declineOrder(orderId);
  };

  return (
    <>
      <div className="pb-2">
        <RiderPageHeader title="Dashboard" subtitle="Manage your deliveries" />
      </div>

      <div className="pb-3 space-y-4">
        <StatusToggle
          checked={isAvailable}
          onChange={toggleAvailability}
        />

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={cashOutline}
            label="Today's Earnings"
            value={`₱${todayEarnings.toFixed(2)}`}
            gradientFrom="#6D28D9"
            gradientTo="#8B5CF6"
          />
          <StatCard
            icon={checkmarkCircleOutline}
            label="Completed Today"
            value={String(todayDelivered.length)}
            gradientFrom="#10B981"
            gradientTo="#34D399"
          />
        </div>
      </div>

      {/* Active Delivery Summary */}
      {activeDelivery && (
        <div className="pb-3">
          <h3 className="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-[var(--ion-text-color-secondary)]">
            Active Delivery
          </h3>
          <OrderCard
            order={activeDelivery}
            actions={
              <RiderActionButton variant="primary" expand="block" onClick={() => history.push(`/rider/delivery/${activeDelivery.id}`, { order: activeDelivery })}>
                Continue Delivery
              </RiderActionButton>
            }
          />
        </div>
      )}

      {/* Available Orders */}
      {isAvailable && (
        <>
          <div className="pb-2">
            <div className="flex items-center gap-2">
              <h2 className="m-0 text-sm font-bold text-[var(--ion-text-color)]">Available Orders</h2>
              {filterDeclined(availableOrders).length > 0 && (
                <span className="text-xs font-bold text-white bg-[var(--ion-color-primary)] px-2 py-0.5 rounded-full leading-none">
                  {filterDeclined(availableOrders).length}
                </span>
              )}
            </div>
          </div>

          <div className="pb-4 space-y-4">
            {processedOrders.length === 0 ? (
              <EmptyState
                icon="cube-outline"
                title="No orders available right now"
                subtitle="Waiting for vendors to mark orders as ready"
              />
            ) : (
              processedOrders.map(order => {
                const dist = riderCoords && order.stallLatitude && order.stallLongitude
                  ? haversineKm(riderCoords.lat, riderCoords.lng, order.stallLatitude, order.stallLongitude)
                  : null;
                return (
                  <OrderCard
                    key={order.id}
                    order={order}
                    distanceKm={dist}
                    actions={
                      <div className="flex gap-2">
                        <RiderActionButton variant="decline" className="flex-1" onClick={(e) => handleDecline(e, order.id)}>
                          Decline
                        </RiderActionButton>
                        <RiderActionButton variant="primary" className="flex-1" onClick={() => history.push('/rider/orders')}>
                          View Order
                        </RiderActionButton>
                      </div>
                    }
                  />
                );
              })
            )}
          </div>
        </>
      )}

      {!isAvailable && (
        <EmptyState
          icon={bicycleOutline}
          title="You're currently offline"
          subtitle="Toggle above to go online and start accepting orders"
        />
      )}
    </>
  );
};

export default RiderDashboard;
