import React, { useState, useEffect, useCallback } from 'react';
import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import {
  locationOutline, bicycleOutline, cashOutline, storefrontOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

import CartItem from '../../components/Cart/CartItem';
import OptimizedImage from '../../components/OptimizedImage';

import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { fetchStallById } from '../../services/stallService';
import { createOrder } from '../../services/orderService';
import { getDeliveryFeeInfo } from '../../services/deliveryService';
import { validatePinAgainstAddress, getStoredCoords } from '../../utils/geocode';
import { registerRefreshHandler } from '../../utils/refreshBus';
import type { Order, Stall } from '../../types';

const UserCart: React.FC = () => {
  const history = useHistory();
  const { items, updateQuantity, removeFromCart, clearCart, total } = useCart();
  const { addOrder } = useOrders();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [unavailableItems, setUnavailableItems] = useState<string[]>([]);
  const [feeLoading, setFeeLoading] = useState(true);
  const [feeError, setFeeError] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [serviceFee] = useState(1.49);
  const [rawDistance, setRawDistance] = useState<number | null>(null);
  const [chargedDistance, setChargedDistance] = useState<number>(0);
  const [stall, setStall] = useState<Stall | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [validating, setValidating] = useState(false);
  const [locationMismatch, setLocationMismatch] = useState(false);
  const [locationNotice, setLocationNotice] = useState(false);
  const [locationNoticeMsg, setLocationNoticeMsg] = useState('');

  const calcFee = useCallback(async () => {
    if (items.length === 0) return;
    setFeeLoading(true);
    setFeeError(false);
    let fetched: Stall | null = null;
    try {
      const stallId = items[0]?.stallId || '';
      fetched = stallId ? await fetchStallById(stallId) : null;
      setStall(fetched);
      const custLocation = sessionStorage.getItem('selectedLocation');
      const sessionCoords = custLocation ? JSON.parse(custLocation) : null;
      const custLat = sessionCoords?.lat ?? user?.latitude;
      const custLng = sessionCoords?.lng ?? user?.longitude;
      const info = await getDeliveryFeeInfo(
        fetched?.latitude, fetched?.longitude,
        custLat, custLng
      );
      setDeliveryFee(info.fare);
      setRawDistance(info.distance_km);
      setChargedDistance(info.final_km);
    } catch {
      setFeeError(true);
    }
    setFeeLoading(false);
    if (fetched?.menu) {
      const badItems = items.filter(cartItem => {
        const menuItem = fetched.menu!.find(m => m.id === cartItem.menuItemId);
        return !menuItem || menuItem.available === false;
      });
      setUnavailableItems(badItems.map(i => i.id));
    }
  }, [items, user?.latitude, user?.longitude]);

  useEffect(() => {
    calcFee();
  }, [calcFee]);

  useEffect(() => {
    registerRefreshHandler(calcFee);
    return () => registerRefreshHandler(null);
  }, [calcFee]);

  const finalTotal = total + deliveryFee + serviceFee;

  const handlePayment = async () => {
    setOrderError(null);
    setLocationMismatch(false);
    setLocationNotice(false);
    setLocationNoticeMsg('');

    const pin = getStoredCoords() || (user?.latitude != null && user?.longitude != null ? { lat: user.latitude, lng: user.longitude } : null);
    if (!pin) {
      setOrderError('Please set your delivery location first.');
      return;
    }
    const deliveryAddress = sessionStorage.getItem('locationName') || user?.address || '';
    if (!deliveryAddress.trim() || deliveryAddress.trim() === 'Current Location') {
      setOrderError('Please set your delivery address in the location picker before ordering.');
      return;
    }

    setValidating(true);
    const validation = await validatePinAgainstAddress(pin.lat, pin.lng, deliveryAddress);
    setValidating(false);

    if (!validation.valid) {
      setLocationMismatch(true);
      setOrderError("Your map pin and address don't match. Please move the pin to your exact location before continuing. Tip: Zoom in and place the pin directly on your house.");
      return;
    }
    if (validation.geocodeFailed || validation.unverifiable) {
      setLocationNotice(true);
      setLocationNoticeMsg(
        validation.unverifiable
          ? "We couldn't confirm your exact address against the map — your order will proceed. Please make sure the pin is on your exact house."
          : "Couldn't verify your address automatically — your order will proceed."
      );
    }

    setLoading(true);
    try {
      const stallId = items[0]?.stallId || '';
      const stall = stallId ? await fetchStallById(stallId) : null;
      if (!stall) throw new Error('Stall not found');
      if (stall.active === false) throw new Error('This stall is no longer accepting orders');
      if (stall.menu) {
        const badItems = items.filter(cartItem => {
          const menuItem = stall.menu!.find(m => m.id === cartItem.menuItemId);
          return !menuItem || menuItem.available === false;
        });
        if (badItems.length > 0) {
          throw new Error(`Some items in your cart are no longer available: ${badItems.map(i => i.name).join(', ')}. Please remove them and try again.`);
        }
      }
      const orderData: Omit<Order, 'id'> = {
        userId: user?.id || '',
        stallId,
        vendorId: stall?.vendorId || '',
        stallName: stall?.name || '',
        customerName: user?.name || user?.email?.split('@')[0] || 'Customer',
        customerPhone: user?.phone || '',
        items: items.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          selectedOptions: item.selectedOptions,
          selectedAddOns: item.selectedAddOns,
          specialInstructions: item.specialInstructions,
        })),
        total: finalTotal,
        deliveryFee,
        distance: chargedDistance || undefined,
        status: 'pending',
        createdAt: new Date(),
        deliveryAddress: deliveryAddress,
        customerLatitude: pin?.lat ?? user?.latitude ?? undefined,
        customerLongitude: pin?.lng ?? user?.longitude ?? undefined,
        stallLatitude: stall?.latitude ?? undefined,
        stallLongitude: stall?.longitude ?? undefined,
      };
      const order = await createOrder(orderData);
      if (order) {
        addOrder(order);
        clearCart();
        setToastMessage('Order placed!');
        setShowToast(true);
        setTimeout(() => history.push('/customer/order-tracking', { order }), 700);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to place order';
      setOrderError(msg);
      console.error('Failed to place order:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>


        <div className="w-full flex-1 flex flex-col pb-10 md:pt-8 space-y-3 sm:space-y-4">
          <div>
            <h2 className="m-0 text-xl xs:text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--ion-text-color)]">
              Your Cart
            </h2>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 px-6 text-center min-h-[65vh]">
              <div className="w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 rounded-full bg-[var(--ion-card-background)] border-2 border-[var(--ion-border-color)] flex items-center justify-center mb-6">
                <IonIcon icon={bicycleOutline} className="text-4xl sm:text-5xl text-[var(--ion-color-primary)]" />
              </div>
              <h2 className="m-0 mb-2 font-bold text-base sm:text-lg text-[var(--ion-text-color)]">Your cart is empty</h2>
              <p className="m-0 text-sm text-[var(--ion-text-color-secondary)]">Add some delicious food to get started!</p>
              <IonButton shape="round" className="mt-6 min-h-[44px]" onClick={() => history.push('/customer/home')}>
                Browse Stalls
              </IonButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] lg:gap-6 items-start">
              <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3 bg-[var(--ion-card-background)] p-3 sm:p-4 rounded-2xl border border-[var(--ion-border-color)]">
                <div className="w-10 h-10 rounded-full bg-[var(--ion-background-color)] border border-[var(--ion-border-color)] flex items-center justify-center shrink-0">
                  <IonIcon icon={locationOutline} className="text-[var(--ion-color-primary)] text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="m-0 mb-0.5 text-xs text-[var(--ion-text-color-secondary)]">Deliver to</p>
                  <p className="m-0 font-semibold text-sm sm:text-base text-[var(--ion-text-color)] truncate">{sessionStorage.getItem('locationName') || user?.address || 'Current Location'}</p>
                </div>
                <IonButton fill="clear" size="small" className="font-semibold" onClick={() => history.push('/customer/location')}>Change</IonButton>
              </div>

              {stall && (
                <div className="bg-[var(--ion-card-background)] p-3 sm:p-4 rounded-2xl border border-[var(--ion-border-color)]">
                  <div className="flex items-center gap-3">
                    {stall.logo && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                        <OptimizedImage src={stall.logo} alt={stall.name} width={48} height={48} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="m-0 mb-0.5 font-semibold text-sm sm:text-base text-[var(--ion-text-color)] truncate">{stall.name}</p>
                      {stall.address && (
                        <p className="m-0 text-xs text-[var(--ion-text-color-secondary)] truncate">
                          <IonIcon icon={locationOutline} className="align-middle mr-1" />
                          {stall.address}
                        </p>
                      )}
                      {rawDistance != null && (
                        <p className="m-0 mt-0.5 text-xs text-[var(--ion-color-primary)]">Distance: {rawDistance} km</p>
                      )}
                    </div>
                    <IonIcon icon={storefrontOutline} className="text-xl sm:text-2xl text-[var(--ion-text-color-secondary)]/40" />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id}>
                    {unavailableItems.includes(item.id) && (
                      <div className="mb-1 text-xs font-semibold text-red-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        This item is no longer available
                      </div>
                    )}
                    <CartItem
                      item={item}
                      onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                      onRemove={() => removeFromCart(item.id)}
                    />
                  </div>
                ))}
              </div>
              </div>

              <div className="lg:sticky lg:top-24 space-y-3 sm:space-y-4">
              <div className="bg-[var(--ion-card-background)] p-3 sm:p-4 rounded-2xl border border-[var(--ion-border-color)]">
                <h3 className="m-0 mb-4 font-bold text-sm sm:text-base text-[var(--ion-text-color)]">Bill Details</h3>
                <div className="flex justify-between items-center py-1.5 text-xs sm:text-sm text-[var(--ion-text-color)]">
                  <span>Subtotal</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-xs sm:text-sm text-[var(--ion-text-color)]">
                  <span className="flex flex-col">
                    <span>Delivery Fee</span>
                    {rawDistance != null && !feeError && <span className="text-[10px] text-[var(--ion-text-color-secondary)]">{rawDistance} km → {chargedDistance} km charged</span>}
                  </span>
                  <span>{feeLoading ? <IonSpinner className="inline-block" style={{ width: 14, height: 14 }} /> : feeError ? <span className="text-red-500">Unavailable</span> : `₱${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-xs sm:text-sm text-[var(--ion-text-color)]">
                  <span>Service Fee</span>
                  <span>₱{serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 mt-2 border-t border-[var(--ion-border-color)] font-bold text-base sm:text-lg text-[var(--ion-text-color)]">
                  <span>Total</span>
                  <span className="text-[var(--ion-color-primary)]">₱{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Cash on Delivery */}
              <div className="bg-[var(--ion-card-background)] p-3 sm:p-4 rounded-2xl border border-[var(--ion-border-color)] text-center">
                <IonIcon icon={cashOutline} className="text-3xl sm:text-4xl text-[#10B981] mb-3" />
                <p className="m-0 mb-1 text-sm sm:text-base font-semibold text-[var(--ion-text-color)]">
                  Pay with cash on delivery
                </p>
                <p className="m-0 text-xs sm:text-sm text-[var(--ion-text-color-secondary)]">
                  No online payment needed. Pay when your order arrives.
                </p>
              </div>

              {orderError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 text-center">
                  {orderError}
                  {locationMismatch && (
                    <IonButton
                      size="small"
                      fill="outline"
                      shape="round"
                      className="mt-3 min-h-[36px] w-full sm:w-auto"
                      onClick={() => history.push('/customer/location')}
                    >
                      Adjust location
                    </IonButton>
                  )}
                </div>
              )}
              {locationNotice && !orderError && (
                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3 text-center">
                  <p className="m-0 text-xs sm:text-sm text-amber-700 dark:text-amber-300 font-medium">
                    {locationNoticeMsg}
                  </p>
                </div>
              )}
              {feeError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
                  <p className="m-0 text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">
                    Couldn't calculate the delivery fee. Pull down to retry or check your connection.
                  </p>
                </div>
              )}
              {items.length > 0 && (
                <div className="space-y-3">
                  {user?.emailVerified !== true && (
                    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3 text-center">
                      <p className="m-0 text-xs sm:text-sm text-amber-700 dark:text-amber-300 font-medium">
                        Verify your email to place orders
                      </p>
                      <IonButton
                        size="small"
                        fill="outline"
                        shape="round"
                        className="mt-2 min-h-[36px] w-full sm:w-auto"
                        onClick={() => history.push('/verify-otp')}
                      >
                        Go to Verification
                      </IonButton>
                    </div>
                  )}
                  <IonButton
                    expand="block" size="large" shape="round"
                    className="min-h-[48px] sm:min-h-[56px] font-bold"
                    onClick={handlePayment}
                    disabled={loading || validating || user?.emailVerified !== true || feeError}
                    style={{ '--background': user?.emailVerified === true && !feeError ? undefined : '#9CA3AF' } as React.CSSProperties}
                  >
                    {loading ? 'Processing...' : validating ? 'Checking address...' : user?.emailVerified === true ? `Pay ₱${finalTotal.toFixed(2)}` : 'Verify email to order'}
                  </IonButton>
                </div>
              )}
              </div>
              </div>
          )}
        </div>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={2000}
          position="bottom"
          onDidDismiss={() => setShowToast(false)}
        />
    </>
  );
};

export default UserCart;
