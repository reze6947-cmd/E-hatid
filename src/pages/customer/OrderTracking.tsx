import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonAlert,
  IonModal,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonTitle,
} from '@ionic/react';
import { checkmarkCircle, bicycleOutline, documentTextOutline, callOutline, locationOutline, closeCircleOutline, closeOutline, star, timeOutline, personOutline, navigateOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useOrders } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { fetchStallById } from '../../services/stallService';
import { updateOrderStatus } from '../../services/orderService';
import PageLoader from '../../components/PageLoader';
import { subscribeRiderLocation } from '../../services/riderLocationService';
import { hasReviewedOrder, getRiderReviewStats } from '../../services/reviewService';
import { openGoogleMapsDirections } from '../../utils/geocode';
import ReviewModal from '../../components/Reviews/ReviewModal';
import OptimizedImage from '../../components/OptimizedImage';
import type { Order, Stall, RiderLocation } from '../../types';
import { formatOrderCode, formatOrderDate } from '../../utils/orderFormat';

const deliveryStages = [
  { label: 'Preparing' },
  { label: 'Ready' },
  { label: 'On the Way' },
  { label: 'Delivered' },
];

const OrderTracking: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory<{ order?: Order }>();
  const initialOrder = history.location.state?.order;
  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [riderRating, setRiderRating] = useState(0);
  const [riderReviewCount, setRiderReviewCount] = useState(0);
  const [stall, setStall] = useState<Stall | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [reviewChecking, setReviewChecking] = useState(true);
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(null);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [remainingDistance, setRemainingDistance] = useState<number | null>(null);
  const { updateOrderStatus: localUpdateStatus } = useOrders();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!initialOrder?.id) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, 'orders', initialOrder.id), (snap) => {
      if (!mountedRef.current) return;
      if (snap.exists()) {
        setOrder({ ...snap.data(), id: snap.id } as Order);
      }
      setLoading(false);
    }, () => {
      setLoading(false);
    });
    return () => { mountedRef.current = false; unsub(); };
  }, [initialOrder?.id]);

  const cancelled = order?.status === 'cancelled';
  const isDelivering = order?.status === 'delivering';
  const isDelivered = order?.status === 'delivered';

  const statusLabel = cancelled
    ? 'Cancelled'
    : order?.status === 'pending' ? 'Pending'
    : order?.status === 'accepted' || order?.status === 'preparing' ? 'Preparing'
    : order?.status === 'ready' ? 'Ready'
    : order?.status === 'delivering' ? 'On the Way'
    : order?.status === 'delivered' ? 'Delivered'
    : 'Active';

  // Progress computation — distance-based when rider is delivering, otherwise status-based
  const progress = (() => {
    if (isDelivered) return 100;
    if (isDelivering && totalDistance && remainingDistance != null && totalDistance > 0) {
      return Math.min(100, Math.max(0, Math.round((1 - remainingDistance / totalDistance) * 100)));
    }
    if (isDelivering) return 40;
    if (order?.status === 'ready') return 20;
    if (order?.status === 'preparing') return 15;
    if (order?.status === 'accepted') return 10;
    return 0;
  })();

  const activeStage = progress >= 100 ? 3 : progress >= 40 ? 2 : progress >= 20 ? 1 : 0;
  const stageProgress = (() => {
    if (progress >= 100) return 100;
    if (activeStage === 0) return (progress / 20) * 100;
    if (activeStage === 1) return ((progress - 20) / 20) * 100;
    if (activeStage === 2) return ((progress - 40) / 50) * 100;
    return 0;
  })();

  useEffect(() => {
    if (!order) return;
    if (order.stallId) {
      fetchStallById(order.stallId).then(s => {
        if (mountedRef.current) setStall(s);
      }).catch(() => {});
    }
  }, [order?.stallId]);

  // Rider review rating (shown once the rider picks up / delivers)
  useEffect(() => {
    if (!order?.riderId) {
      setRiderRating(0);
      setRiderReviewCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      const stats = await getRiderReviewStats(order.riderId!);
      if (!cancelled) {
        setRiderRating(stats.average);
        setRiderReviewCount(stats.total);
      }
    })();
    return () => { cancelled = true; };
  }, [order?.riderId]);

  // 1. Total OSRM distance stall→customer (for progress calc)
  useEffect(() => {
    if (!stall?.latitude || !stall?.longitude || !order?.customerLatitude || !order?.customerLongitude || totalDistance != null) return;
    let cancelled = false;
    (async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${stall.longitude},${stall.latitude};${order.customerLongitude},${order.customerLatitude}?overview=false`;
        const res = await fetch(url);
        const data = await res.json();
        if (!cancelled && data.code === 'Ok' && data.routes?.length) {
          setTotalDistance(data.routes[0].distance / 1000);
        }
      } catch { /* distance fetch is best-effort */ }
    })();
    return () => { cancelled = true; };
  }, [stall?.latitude, stall?.longitude, order?.customerLatitude, order?.customerLongitude, totalDistance]);

  // 3. Subscribe to rider location when delivering
  useEffect(() => {
    if (!order?.id || !isDelivering) return;
    const unsub = subscribeRiderLocation(order.id, (location) => {
      setRiderLocation(location);
    });
    return () => { unsub(); setRiderLocation(null); };
  }, [order?.id, isDelivering]);

  // 4. Calculate remaining distance when rider location changes
  useEffect(() => {
    if (!riderLocation || !order?.customerLatitude || !order?.customerLongitude) {
      setRemainingDistance(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${riderLocation.lng},${riderLocation.lat};${order.customerLongitude},${order.customerLatitude}?overview=false`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled || data.code !== 'Ok' || !data.routes?.length) return;
        setRemainingDistance(data.routes[0].distance / 1000);
      } catch { /* remaining-distance fetch is best-effort */ }
    })();
    return () => { cancelled = true; };
  }, [riderLocation, order?.customerLatitude, order?.customerLongitude]);

  const checkReviewed = useCallback(async () => {
    if (!order?.id) {
      setReviewChecking(false);
      return;
    }
    setReviewChecking(true);
    const already = await hasReviewedOrder(order.id);
    if (!mountedRef.current) return;
    setReviewed(already);
    setReviewChecking(false);
  }, [order?.id]);

  useEffect(() => {
    checkReviewed();
  }, [checkReviewed]);

  const handleCancelOrder = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      await updateOrderStatus(order.id, { status: 'cancelled', cancelledReason: 'Cancelled by customer' });
      localUpdateStatus(order.id, 'cancelled');
    } catch (err) {
      console.error('Failed to cancel order:', err);
    } finally {
      setCancelling(false);
      setShowCancelAlert(false);
    }
  };

  if (loading) {
    return <PageLoader message="Loading your order..." />;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
        <div className="w-20 h-20 rounded-full bg-[var(--ion-card-background)] border-2 border-[var(--ion-border-color)] flex items-center justify-center">
          <IonIcon icon={documentTextOutline} className="text-3xl text-[var(--ion-color-primary)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--ion-text-color)]">Order not found</h2>
        <p className="text-sm text-[var(--ion-text-color-secondary)]">This order may have been removed</p>
        <IonButton shape="round" onClick={() => history.push('/customer/home')}>
          Back to Home
        </IonButton>
      </div>
    );
  }

  if (order.userId && user && order.userId !== user.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
        <div className="w-20 h-20 rounded-full bg-[var(--ion-card-background)] border-2 border-[var(--ion-border-color)] flex items-center justify-center">
          <IonIcon icon={closeCircleOutline} className="text-3xl text-[var(--ion-color-primary)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--ion-text-color)]">Access denied</h2>
        <p className="text-sm text-[var(--ion-text-color-secondary)]">You don't have access to this order</p>
        <IonButton shape="round" onClick={() => history.push('/customer/home')}>
          Back to Home
        </IonButton>
      </div>
    );
  }

  const subtotal = (order.items || []).reduce((s, i) => s + i.price * i.quantity, 0);
  const hasDeliveryFee = order.deliveryFee != null && order.deliveryFee > 0;

  const customizationText = (item: Order['items'][0]): string | null => {
    const parts: string[] = [];
    if (item.selectedOptions?.length) {
      item.selectedOptions.forEach(opt => parts.push(opt.choiceName));
    }
    if (item.selectedAddOns?.length) {
      item.selectedAddOns.forEach(addon => parts.push(`+${addon.name}`));
    }
    return parts.length ? parts.join(', ') : null;
  };

  return (
    <>
      <div className="w-full flex-1 md:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] lg:gap-6 items-start pt-2 sm:pt-3 pb-10">

          {/* Left Column */}
          <div className="space-y-3 sm:space-y-4">
          {/* Header Card — Stall + Status + ETA */}
          {!loading && stall && (
            <div className="bg-[var(--ion-card-background)] rounded-2xl border border-[var(--ion-border-color)] overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {stall.logo && (
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                      <OptimizedImage src={stall.logo} alt={stall.name} width={56} height={56} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h1 className="m-0 text-lg font-bold text-[var(--ion-text-color)] truncate">{stall.name}</h1>
                    {stall.address && (
                      <p className="m-0 mt-0.5 text-xs text-[var(--ion-text-color-secondary)] truncate">
                        <IonIcon icon={locationOutline} className="align-middle mr-1" />
                        {stall.address}
                      </p>
                    )}
                  </div>
                  <div className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    cancelled ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                  }`}>
                    {cancelled ? 'Cancelled' : (order.estimatedDeliveryTime || statusLabel)}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-[var(--ion-text-color-secondary)] border-t border-[var(--ion-border-color)] pt-3">
                  <span className="truncate">{formatOrderCode(order.id)}</span>
                  {order.estimatedDeliveryTime && !cancelled && (
                    <span className="flex items-center gap-1">
                      <IonIcon icon={timeOutline} className="text-sm" />
                      {order.estimatedDeliveryTime}
                    </span>
                  )}
                  {order.stallName && (
                    <span className="flex items-center gap-1">
                      <IonIcon icon={personOutline} className="text-sm" />
                      {order.stallName}
                    </span>
                  )}
                </div>
                {order.createdAt && (
                  <div className="flex items-center gap-1.5 px-4 pt-2 pb-3 text-xs text-[var(--ion-text-color-secondary)] border-t border-[var(--ion-border-color)]">
                    <IonIcon icon={documentTextOutline} className="text-sm shrink-0" />
                    Placed on {formatOrderDate(order.createdAt)}
                  </div>
                )}
              </div>

              {/* Delivery Stages Progress Bar */}
              {!cancelled && (
                <div className="px-4 pb-4">
                  <div className="relative mb-6">
                    <div className="flex items-center justify-between mb-1">
                      {deliveryStages.map((stage, i) => {
                        const isActive = i <= activeStage;
                        return (
                          <div key={stage.label} className="flex flex-col items-center" style={{ width: '22%' }}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 ${
                              isActive ? 'bg-[var(--ion-color-primary)] scale-110' : 'bg-[var(--ion-card-background)] border-2 border-[var(--ion-border-color)]'
                            }`}>
                              {isActive && (
                                i === activeStage && progress < 100
                                  ? <div className="w-2.5 h-2.5 rounded-full bg-white" style={{ opacity: 0.3 + stageProgress / 100 * 0.7 }} />
                                  : <div className="w-2.5 h-2.5 rounded-full bg-white" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Connecting lines */}
                    <div className="absolute top-3.5 left-[11%] right-[11%] flex" style={{ transform: 'translateY(-50%)' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} className="flex-1 h-0.5 mx-0.5 rounded-full transition-all duration-500" style={{
                          background: i < activeStage
                            ? 'var(--ion-color-primary)'
                            : i === activeStage
                              ? `linear-gradient(90deg, var(--ion-color-primary) ${stageProgress}%, var(--ion-border-color) ${stageProgress}%)`
                              : 'var(--ion-border-color)'
                        }} />
                      ))}
                    </div>
                    {/* Labels */}
                    <div className="flex items-center justify-between mt-1.5">
                      {deliveryStages.map((stage, i) => {
                        const isActive = i <= activeStage;
                        return (
                          <span key={stage.label} className="text-[9px] text-center whitespace-nowrap transition-all duration-300" style={{
                            width: '22%',
                            color: isActive ? 'var(--ion-color-primary)' : 'var(--ion-text-color-secondary)',
                            fontWeight: isActive ? 700 : 400,
                          }}>
                            {stage.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {riderLocation && isDelivering && (
                    <div className="text-center">
                      <span className="text-[10px] text-[var(--ion-text-color-secondary)]">{progress}% complete</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cancelled Reason */}
          {order.cancelledReason && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600 dark:text-red-400 text-left border border-red-200 dark:border-red-800">
              <strong className="block mb-1">Cancelled:</strong>
              {order.cancelledReason}
            </div>
          )}

          {/* Status Messages */}
          {order.status === 'pending' && !cancelled && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-sm text-amber-700 dark:text-amber-400 text-center border border-amber-200 dark:border-amber-800">
              Waiting for vendor to accept your order
            </div>
          )}

          {order.status === 'accepted' && !cancelled && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-sm text-green-700 dark:text-green-400 text-center border border-green-200 dark:border-green-800">
              <IonIcon icon={checkmarkCircle} className="align-middle mr-1" />
              Order accepted! The vendor is preparing your food.
            </div>
          )}

          {order.status === 'preparing' && !cancelled && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-700 dark:text-blue-400 text-center border border-blue-200 dark:border-blue-800">
              The vendor is preparing your order
            </div>
          )}

          {order.status === 'ready' && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-700 dark:text-blue-400 text-center border border-blue-200 dark:border-blue-800">
              Order is ready for pickup. Waiting for a rider to accept.
            </div>
          )}

          {isDelivering && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-sm text-green-700 dark:text-green-400 text-center border border-green-200 dark:border-green-800">
              <IonIcon icon={bicycleOutline} className="align-middle mr-1" />
              {order.riderName
                ? `Kuya ${order.riderName.split(' ')[0]} is on the way!`
                : 'Your rider is on the way!'}
              {order.riderName && (order.riderPhone || order.riderPlate || riderReviewCount > 0) && (
                <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800 text-left space-y-1">
                  {order.riderPhone && (
                    <p className="m-0 text-xs">
                      <IonIcon icon={callOutline} className="align-middle mr-1" />
                      {order.riderPhone}
                    </p>
                  )}
                  {order.riderPlate && (
                    <p className="m-0 text-xs">
                      <IonIcon icon={bicycleOutline} className="align-middle mr-1" />
                      {order.riderPlate}
                    </p>
                  )}
                  {riderReviewCount > 0 && (
                    <p className="m-0 text-xs">
                      <IonIcon icon={star} className="align-middle mr-1" />
                      {riderRating.toFixed(1)} rating · {riderReviewCount} review{riderReviewCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Estimated Arrival */}
          {isDelivering && (
            <div className="bg-[var(--ion-card-background)] rounded-2xl border border-[var(--ion-border-color)] overflow-hidden">
              <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                <IonIcon icon={timeOutline} className="text-[var(--ion-color-primary)] text-base" />
                <span className="text-xs font-bold text-[var(--ion-text-color-secondary)] uppercase tracking-[0.3px]">Estimated Arrival</span>
              </div>
              <div className="px-4 pb-4 text-center">
                {order.riderName && (
                  <p className="m-0 text-sm font-semibold text-[var(--ion-text-color)] mb-1">
                    {order.riderName.split(' ')[0]} is on the way
                  </p>
                )}
                {remainingDistance != null ? (
                  <>
                    <p className="m-0 text-3xl font-bold text-[var(--ion-color-primary)]">
                      ~{Math.round((remainingDistance / 25) * 60)} min
                    </p>
                    <p className="m-0 mt-1 text-xs text-[var(--ion-text-color-secondary)]">
                      {remainingDistance.toFixed(1)} km remaining
                    </p>
                  </>
                ) : (
                  <p className="m-0 text-sm text-[var(--ion-text-color-secondary)]">Calculating ETA...</p>
                )}
              </div>
            </div>
          )}
          </div>

          {/* Right Column */}
          <div className="lg:sticky lg:top-24 space-y-3 sm:space-y-4">
          {/* Order Items + Bill Details */}
          <div className="bg-[var(--ion-card-background)] rounded-2xl border border-[var(--ion-border-color)] overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="text-xs font-bold text-[var(--ion-text-color-secondary)] uppercase tracking-[0.3px]">Order Items</span>
              <IonButton fill="clear" size="small" style={{ '--color': '#8B5CF6' }} className="m-0 min-h-0 h-7" onClick={() => setDetailsOrder(order)}>
                <IonIcon icon={documentTextOutline} slot="icon-only" />
              </IonButton>
            </div>
            <div className="px-4 pb-2 space-y-3">
              {order.items.map((item, i) => {
                const customization = customizationText(item);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }}>
                      {item.image ? (
                        <OptimizedImage src={item.image} alt={item.name} width={44} height={44} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-base text-white/60 font-bold">{item.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="m-0 text-sm font-semibold text-[var(--ion-text-color)] truncate">{item.name}</p>
                      {customization && <p className="mt-0.5 text-xs text-[var(--ion-text-color-secondary)]">{customization}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="m-0 text-sm font-bold text-[var(--ion-text-color)]">₱{(item.price * item.quantity).toFixed(2)}</p>
                      <p className="m-0 text-xs text-[var(--ion-text-color-secondary)]">x{item.quantity}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-[var(--ion-border-color)] mx-4" />
            <div className="px-4 py-3 space-y-2">
              <div className="flex justify-between text-xs sm:text-sm text-[var(--ion-text-color)]">
                <span>Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              {hasDeliveryFee && (
                <div className="flex justify-between text-xs sm:text-sm text-[var(--ion-text-color)]">
                  <span>Delivery Fee (charged: {order.distance} km)</span>
                  <span>₱{order.deliveryFee!.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="border-t border-[var(--ion-border-color)] mx-4" />
            <div className="px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-bold text-[var(--ion-text-color)]">Total</span>
              <span className="text-lg font-bold text-[var(--ion-color-primary)]">₱{(order.total ?? 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {(order.items || []).some(item => item.specialInstructions) && (
            <div className="bg-[var(--ion-card-background)] rounded-2xl border border-[var(--ion-border-color)] overflow-hidden p-4">
              <span className="text-xs font-bold text-[var(--ion-text-color-secondary)] uppercase tracking-[0.3px]">Notes</span>
              {order.items.filter(i => i.specialInstructions).map((item, i) => (
                <div key={i} className="mt-3">
                  <p className="m-0 text-sm font-semibold text-[var(--ion-text-color)]">{item.name}</p>
                  <p className="m-0 mt-0.5 text-xs italic text-[var(--ion-text-color-secondary)]">"{item.specialInstructions}"</p>
                </div>
              ))}
            </div>
          )}

          {/* Rider Info */}
          {!loading && order.riderName && (isDelivering || isDelivered) && (
            <div className="bg-[var(--ion-card-background)] rounded-2xl border border-[var(--ion-border-color)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <IonIcon icon={bicycleOutline} className="text-[var(--ion-color-primary)] text-lg" />
                <span className="text-xs font-bold text-[var(--ion-text-color-secondary)] uppercase tracking-[0.3px]">Your Rider</span>
                {riderReviewCount > 0 && (
                  <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-[#F59E0B]">
                    <IonIcon icon={star} className="text-sm" />
                    {riderRating.toFixed(1)} ({riderReviewCount})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--ion-color-primary)]/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {order.riderAvatar ? (
                    <OptimizedImage src={order.riderAvatar} alt={order.riderName} width={48} height={48} className="w-full h-full object-cover" />
                  ) : (
                    <IonIcon icon={personOutline} className="text-xl text-[var(--ion-color-primary)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="m-0 text-sm font-semibold text-[var(--ion-text-color)]">{order.riderName}</p>
                  {order.riderPhone && (
                    <a href={`tel:${order.riderPhone.replace(/\s/g, '')}`} className="m-0 mt-0.5 text-xs text-[var(--ion-text-color-secondary)] no-underline hover:text-[var(--ion-color-primary)]">
                      <IonIcon icon={callOutline} className="align-middle mr-1" />
                      {order.riderPhone}
                    </a>
                  )}
                  {order.riderPlate && (
                    <p className="m-0 text-xs text-[var(--ion-text-color-secondary)]">
                      <IonIcon icon={bicycleOutline} className="align-middle mr-1" />
                      {order.riderPlate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {order.status === 'pending' && !cancelled && (
              <IonButton
                expand="block"
                fill="outline"
                style={{ '--border-color': '#EF4444', '--color': '#EF4444', '--border-radius': '12px' }}
                className="h-12 text-sm font-semibold"
                onClick={() => setShowCancelAlert(true)}
                disabled={cancelling}
              >
                <IonIcon icon={closeCircleOutline} slot="start" />
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </IonButton>
            )}

            {order.status === 'delivered' && (
              reviewed ? (
                <div className="p-4 rounded-2xl text-center border" style={{ background: 'color-mix(in srgb, #10B981 12%, transparent)', borderColor: 'color-mix(in srgb, #10B981 30%, transparent)' }}>
                  <IonIcon icon={checkmarkCircle} className="text-2xl mb-1" style={{ color: '#10B981' }} />
                  <p className="m-0 text-sm font-semibold" style={{ color: '#10B981' }}>Review submitted</p>
                </div>
              ) : (
                <IonButton
                  expand="block"
                  style={{ '--background': '#8B5CF6', '--border-radius': '12px' }}
                  className="h-12 text-sm font-semibold"
                  onClick={() => setReviewOrder(order)}
                  disabled={reviewChecking}
                >
                  {reviewChecking ? <IonSpinner /> : <IonIcon icon={star} slot="start" />}
                  {reviewChecking ? 'Checking...' : 'Leave a Review'}
                </IonButton>
              )
            )}

            {order.stallLatitude != null && order.stallLongitude != null && order.customerLatitude != null && order.customerLongitude != null && !cancelled && (
              <div>
                <IonButton
                  expand="block"
                  fill="outline"
                  style={{ '--border-color': 'var(--ion-color-primary)', '--color': 'var(--ion-color-primary)', '--border-radius': '12px' }}
                  className="h-12 text-sm font-semibold"
                  onClick={() => openGoogleMapsDirections(
                    order.customerLatitude!,
                    order.customerLongitude!,
                    order.deliveryAddress,
                    order.stallLatitude!,
                    order.stallLongitude!
                  )}
                >
                  <IonIcon icon={navigateOutline} slot="start" />
                  Open Route in Google Maps
                </IonButton>
                <p className="m-0 mt-2 text-xs text-[var(--ion-text-color-secondary)] text-center leading-relaxed">
                  This will open Google Maps to show the delivery route from the store to your address.
                </p>
              </div>
            )}

            <IonButton
              expand="block"
              fill="outline"
              style={{ '--border-color': 'var(--ion-border-color)', '--color': 'var(--ion-text-color-secondary)', '--border-radius': '12px' }}
              className="h-12 text-sm font-semibold"
              onClick={() => history.push('/customer/home')}
            >
              Back to Home
            </IonButton>
          </div>
          </div>

        </div>
      </div>

      <IonAlert
        isOpen={showCancelAlert}
        onDidDismiss={() => setShowCancelAlert(false)}
        header="Cancel Order?"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        buttons={[
          { text: 'No, keep it', role: 'cancel' },
          { text: 'Yes, cancel', role: 'destructive', handler: handleCancelOrder },
        ]}
      />

      <IonModal isOpen={!!detailsOrder} onDidDismiss={() => setDetailsOrder(null)}>
        <IonHeader className="ion-no-border">
          <IonToolbar style={{ '--background': 'var(--ion-card-background)' }}>
            <IonButtons slot="start">
              <IonButton onClick={() => setDetailsOrder(null)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle>Item Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'var(--ion-background-color)' }}>
          {detailsOrder && (
            <div className="p-4">
              <div className="mb-4">
                <p className="m-0 mb-2 text-xs font-bold text-[var(--ion-text-color-secondary)] uppercase tracking-[0.3px]">Items</p>
                {(detailsOrder.items || []).map((item, i) => {
                  const optionsTotal = item.selectedOptions?.reduce((s, o) => s + o.choicePrice, 0) || 0;
                  const addonsTotal = item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0;
                  const basePrice = item.price - optionsTotal - addonsTotal;
                  const qty = item.quantity;
                  return (
                    <div key={i} className="p-3 bg-[var(--ion-card-background)] rounded-xl mb-2 border border-[var(--ion-border-color)]">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-semibold text-[var(--ion-text-color)] flex-1">{item.name}</span>
                        <span className="text-sm font-semibold text-[var(--ion-text-color-secondary)] mx-3">x{qty}</span>
                        <span className="text-sm font-bold text-[var(--ion-text-color)]">₱{basePrice.toFixed(2)}</span>
                      </div>
                      {item.selectedOptions?.map((opt, oi) => {
                        const optTotal = opt.choicePrice * qty;
                        return optTotal > 0 ? (
                          <p key={oi} className="mt-0.5 ml-3 text-xs text-[var(--ion-text-color-secondary)] flex justify-between">
                            <span>{opt.choiceName}</span>
                            <span>₱{optTotal.toFixed(2)}</span>
                          </p>
                        ) : (
                          <p key={oi} className="mt-0.5 ml-3 text-xs text-[var(--ion-text-color-secondary)]">{opt.choiceName}</p>
                        );
                      })}
                      {item.selectedAddOns?.map((addon, ai) => {
                        const addonTotal = addon.price * qty;
                        return (
                          <p key={ai} className="mt-0.5 ml-3 text-xs text-[var(--ion-text-color-secondary)] flex justify-between">
                            <span>+ {addon.name}</span>
                            <span>₱{addonTotal.toFixed(2)}</span>
                          </p>
                        );
                      })}
                      <div className="border-t border-dashed border-[var(--ion-border-color)] mt-1.5 pt-1.5 flex justify-between text-sm font-semibold text-[var(--ion-text-color)]">
                        <span>Item subtotal</span>
                        <span>₱{(item.price * qty).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              {(detailsOrder.items || []).some(item => item.specialInstructions) && (
                <div className="p-3 bg-[var(--ion-card-background)] rounded-xl mb-2 border border-[var(--ion-border-color)]">
                  <p className="m-0 mb-2 text-xs font-bold text-[var(--ion-text-color-secondary)] uppercase tracking-[0.3px]">Notes</p>
                  {detailsOrder.items.filter(i => i.specialInstructions).map((item, i) => (
                    <div key={i} style={{ marginBottom: i < detailsOrder.items.filter(i => i.specialInstructions).length - 1 ? '8px' : 0 }}>
                      <p className="m-0 text-sm font-semibold text-[var(--ion-text-color)]">{item.name}</p>
                      <p className="m-0 mt-0.5 text-xs italic text-[var(--ion-text-color-secondary)]">"{item.specialInstructions}"</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 bg-[var(--ion-card-background)] rounded-xl border border-[var(--ion-border-color)] flex justify-between items-center">
                <span className="text-base font-bold text-[var(--ion-text-color)]">Total</span>
                <span className="text-lg font-bold text-[#8B5CF6]">₱{(detailsOrder.total ?? 0).toFixed(2)}</span>
              </div>
            </div>
          )}
        </IonContent>
      </IonModal>

      <ReviewModal order={reviewOrder} isOpen={!!reviewOrder} onClose={() => { setReviewOrder(null); checkReviewed(); }} />
    </>
  );
};

export default OrderTracking;
