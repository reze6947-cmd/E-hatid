import React, { useState, useEffect, useRef } from 'react';
import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import { arrowBackOutline, callOutline, checkmarkCircleOutline, expandOutline, closeOutline, locationOutline, navigateOutline, personOutline, storefrontOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Marker, Polyline } from 'react-leaflet';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { subscribeRiderLocation } from '../../services/riderLocationService';
import { getUserDocument } from '../../services/userService';
import { fetchStallById } from '../../services/stallService';
import { updateOrderStatus } from '../../services/orderService';
import type { Order, User, Stall, RiderLocation } from '../../types';
import LeafletMap, { type LeafletMapHandle } from '../../components/Map/LeafletMap';
import { markerIcon, stallMarkerIcon, riderMarkerIcon } from '../../components/Map/mapIcons';

const RiderDelivery: React.FC = () => {
  const history = useHistory<{ order?: Order }>();
  const { user } = useAuth();
  const initialOrder = history.location.state?.order;
  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [customerUser, setCustomerUser] = useState<User | null>(null);
  const [stall, setStall] = useState<Stall | null>(null);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [deliveringId, setDeliveringId] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const mountedRef = useRef(true);
  const mapRef = useRef<LeafletMapHandle | null>(null);

  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [fullscreen]);

  const handleBack = () => {
    if (fullscreen) {
      setFullscreen(false);
    } else {
      history.push('/rider/orders');
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    if (!initialOrder?.id) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, 'orders', initialOrder.id), (snap) => {
      if (!mountedRef.current) return;
      if (snap.exists()) {
        const data = snap.data();
        const updatedOrder = { ...data, id: snap.id } as Order;
        setOrder(updatedOrder);
        if (updatedOrder.status === 'delivered') {
          setToastMessage('Order delivered successfully');
          setShowToast(true);
        }
      }
      setLoading(false);
    }, () => {
      setLoading(false);
    });
    return () => { mountedRef.current = false; unsub(); };
  }, [initialOrder?.id]);

  useEffect(() => {
    if (!order) return;
    const tasks: Promise<void>[] = [];
    if (order.userId) {
      tasks.push(
        getUserDocument(order.userId).then(u => {
          if (mountedRef.current) setCustomerUser(u);
        })
      );
    }
    if (order.stallId) {
      tasks.push(
        fetchStallById(order.stallId).then(s => {
          if (mountedRef.current) setStall(s);
        })
      );
    }
    Promise.all(tasks).catch(() => {});
  }, [order?.userId, order?.stallId]);

  // Subscribe to own rider location
  useEffect(() => {
    if (!order?.id) return;
    const unsub = subscribeRiderLocation(order.id, (location) => {
      setRiderLocation(location);
    });
    return () => { unsub(); setRiderLocation(null); };
  }, [order?.id]);

  // OSRM route from stall → customer (or rider → customer if location available)
  useEffect(() => {
    const fromLat = riderLocation ? riderLocation.lat : stall?.latitude;
    const fromLng = riderLocation ? riderLocation.lng : stall?.longitude;
    if (!fromLat || !fromLng || !order?.customerLatitude || !order?.customerLongitude) return;
    let cancelled = false;
    (async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${order.customerLongitude},${order.customerLatitude}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled || data.code !== 'Ok' || !data.routes?.length) return;
        const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
          (c: number[]) => [c[1], c[0]] as [number, number]
        );
        setRouteCoords(coords);
      } catch { }
    })();
    return () => { cancelled = true; };
  }, [stall?.latitude, stall?.longitude, riderLocation, order?.customerLatitude, order?.customerLongitude]);

  const handleDelivered = async () => {
    if (!order) return;
    setDeliveringId(true);
    try {
      await updateOrderStatus(order.id, { status: 'delivered', completedAt: new Date() });
      setToastMessage('Order marked as delivered');
      setShowToast(true);
    } catch (err) {
      console.error('Failed to mark delivered:', err);
      setToastMessage('Failed to mark delivered');
      setShowToast(true);
    } finally {
      setDeliveringId(false);
    }
  };

  if (!order) {
    return (
      <div className="text-center p-12">
        <p className="text-[var(--ion-text-color-secondary)]">Order not found</p>
        <IonButton color="primary" onClick={() => history.push('/rider/orders')}>
          Back to Orders
        </IonButton>
      </div>
    );
  }

  const allMapPoints: [number, number][] = [];
  if (stall?.latitude && stall?.longitude) allMapPoints.push([stall.latitude, stall.longitude]);
  if (order?.customerLatitude && order?.customerLongitude) allMapPoints.push([order.customerLatitude, order.customerLongitude]);
  if (riderLocation) allMapPoints.push([riderLocation.lat, riderLocation.lng]);

  return (
    <>
      <div className="flex items-center gap-3 pt-1 pb-2">
        <IonButton fill="clear" onClick={handleBack} style={{ '--color': 'var(--ion-color-primary)', margin: 0, minHeight: 36 }}>
          <IonIcon icon={arrowBackOutline} slot="icon-only" className="text-lg" />
        </IonButton>
        <h2 className="m-0 text-lg font-bold text-[var(--ion-text-color)]">Delivery</h2>
      </div>
        {/* Order Header */}
        <div className="bg-[var(--ion-card-background)] rounded-2xl border border-[var(--ion-border-color)] overflow-hidden mb-4">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              {stall?.logo && (
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                  <img src={stall.logo} alt={stall.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="m-0 text-lg font-bold text-[var(--ion-text-color)] truncate">
                  <IonIcon icon={storefrontOutline} className="align-middle mr-1.5" />
                  {stall?.name || 'Stall'}
                </h1>
                {stall?.address && (
                  <p className="m-0 mt-0.5 text-xs text-[var(--ion-text-color-secondary)] truncate">
                    <IonIcon icon={locationOutline} className="align-middle mr-1" />
                    {stall.address}
                  </p>
                )}
              </div>
              <span className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'color-mix(in srgb, #10B981 15%, transparent)', color: '#10B981' }}>
                {order.estimatedDeliveryTime || 'Active'}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-[var(--ion-text-color-secondary)] border-t border-[var(--ion-border-color)] pt-3">
              <span className="truncate font-mono">#{order.id.slice(-8).toUpperCase()}</span>
              <span>{order.items.length} item(s)</span>
              <span className="font-bold text-[var(--ion-color-primary)]">₱{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Ordered Items */}
        {order.items.length > 0 && (
          <div className="mb-4 bg-[var(--ion-card-background)] rounded-2xl border border-[var(--ion-border-color)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 pt-3 pb-2">
              <IonIcon icon={storefrontOutline} className="text-[var(--ion-color-primary)] text-base" />
              <span className="text-xs font-bold text-[var(--ion-text-color-secondary)] uppercase tracking-[0.3px]">Ordered Items</span>
            </div>
            <div className="px-4 pb-3 space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-[var(--ion-border-color)] last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--ion-text-color-secondary)]">{item.quantity}x</span>
                      <span className="text-sm font-semibold text-[var(--ion-text-color)] truncate">{item.name}</span>
                    </div>
                    {item.selectedOptions?.map(opt => (
                      <p key={opt.optionId} className="m-0 text-xs text-[var(--ion-text-color-secondary)] ml-6">{opt.optionName}: {opt.choiceName}</p>
                    ))}
                    {item.selectedAddOns?.map(addon => (
                      <p key={addon.addOnId} className="m-0 text-xs text-[var(--ion-text-color-secondary)] ml-6">+ {addon.name}</p>
                    ))}
                    {item.specialInstructions && (
                      <p className="m-0 text-xs italic text-[var(--ion-text-color-secondary)] ml-6">📝 {item.specialInstructions}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-medium text-[var(--ion-text-color)] ml-2">₱{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="mb-4 bg-[var(--ion-card-background)] rounded-2xl border border-[var(--ion-border-color)] overflow-hidden">
          <div className="flex items-center px-4 pt-3 pb-2">
            <span className="text-xs font-bold text-[var(--ion-text-color-secondary)] uppercase tracking-[0.3px]">Order Summary</span>
          </div>
          <div className="px-4 pb-3 space-y-2">
            <div className="flex justify-between text-sm text-[var(--ion-text-color)]">
              <span>Items Total</span>
              <span>₱{(order.total - (order.deliveryFee || 0) - 1.49).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-[var(--ion-text-color)]">
              <span>Delivery Fee</span>
              <span>₱{(order.deliveryFee || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-[var(--ion-text-color)]">
              <span>Service Fee</span>
              <span>₱1.49</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[var(--ion-text-color)] pt-2 border-t border-[var(--ion-border-color)]">
              <span>Total</span>
              <span className="text-[var(--ion-color-primary)]">₱{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Map */}
        {allMapPoints.length >= 2 && (
          <div className={`flex flex-col bg-[var(--ion-card-background)] overflow-hidden ${fullscreen ? 'fixed inset-0 z-[9999]' : 'mb-4 rounded-2xl border border-[var(--ion-border-color)]'}`}>
            <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <IonIcon icon={navigateOutline} className="text-[var(--ion-color-primary)] text-base" />
                <span className="text-xs font-bold text-[var(--ion-text-color-secondary)] uppercase tracking-[0.3px]">
                  {riderLocation ? 'Live Route' : 'Delivery Route'}
                </span>
              </div>
              <IonButton fill="clear" size="small" onClick={() => setFullscreen(!fullscreen)} style={{ '--color': 'var(--ion-color-primary)', margin: 0, minHeight: 32 }}>
                <IonIcon icon={fullscreen ? closeOutline : expandOutline} className="text-lg" />
              </IonButton>
            </div>
            <div className={fullscreen ? 'flex-1 min-h-0' : 'h-[240px] sm:h-[280px] md:h-[320px]'} style={{ position: 'relative', isolation: 'isolate' }}>
              <LeafletMap
                ref={mapRef}
                center={allMapPoints.length > 1
                  ? [(allMapPoints[0][0] + allMapPoints[allMapPoints.length - 1][0]) / 2,
                     (allMapPoints[0][1] + allMapPoints[allMapPoints.length - 1][1]) / 2]
                  : [14.5, 121]}
                zoom={13}
                className="w-full h-full"
                zoomControl={true}
                fitBounds={routeCoords || undefined}
              >
                {stall?.latitude && stall?.longitude && (
                  <Marker position={[stall.latitude, stall.longitude]} icon={stallMarkerIcon} />
                )}
                {order?.customerLatitude && order?.customerLongitude && (
                  <Marker position={[order.customerLatitude, order.customerLongitude]} icon={markerIcon} />
                )}
                {riderLocation && (
                  <Marker position={[riderLocation.lat, riderLocation.lng]} icon={riderMarkerIcon} />
                )}
                {routeCoords && routeCoords.length > 1 && (
                  <Polyline positions={routeCoords} color="var(--ion-color-primary)" weight={4} opacity={0.7} />
                )}
              </LeafletMap>
            </div>
          </div>
        )}

        {/* Customer Info */}
        {customerUser && (
          <div className="mb-4 bg-[var(--ion-card-background)] rounded-2xl border border-[var(--ion-border-color)] p-4">
            <div className="flex items-center gap-2 mb-3">
              <IonIcon icon={personOutline} className="text-[var(--ion-color-primary)] text-lg" />
              <span className="text-xs font-bold text-[var(--ion-text-color-secondary)] uppercase tracking-[0.3px]">Customer</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--ion-color-primary)]/10 flex items-center justify-center shrink-0">
                <IonIcon icon={personOutline} className="text-xl text-[var(--ion-color-primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="m-0 text-sm font-semibold text-[var(--ion-text-color)]">{customerUser.name}</p>
                {customerUser.phone && (
                  <p className="m-0 mt-0.5 text-xs text-[var(--ion-text-color-secondary)]">
                    <IonIcon icon={callOutline} className="align-middle mr-1" />
                    {customerUser.phone}
                  </p>
                )}
                {order.deliveryAddress && (
                  <p className="m-0 mt-0.5 text-xs text-[var(--ion-text-color-secondary)] truncate">
                    <IonIcon icon={locationOutline} className="align-middle mr-1" />
                    {order.deliveryAddress}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action */}
        {order.status === 'delivering' && (
          <IonButton
            expand="block"
            shape="round"
            className="h-12 text-sm font-semibold"
            onClick={handleDelivered}
            disabled={deliveringId}
          >
            {deliveringId ? <IonSpinner /> : <IonIcon icon={checkmarkCircleOutline} slot="start" />}
            {deliveringId ? 'Marking...' : 'Mark Delivered'}
          </IonButton>
        )}

        {order.status === 'delivered' && (
          <div className="p-4 rounded-2xl text-center border" style={{ background: 'color-mix(in srgb, #10B981 15%, transparent)', borderColor: 'color-mix(in srgb, #10B981 30%, transparent)' }}>
            <IonIcon icon={checkmarkCircleOutline} className="text-3xl mb-2" style={{ color: '#10B981' }} />
            <p className="m-0 text-sm font-semibold" style={{ color: '#10B981' }}>Delivered successfully!</p>
          </div>
        )}

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

export default RiderDelivery;
