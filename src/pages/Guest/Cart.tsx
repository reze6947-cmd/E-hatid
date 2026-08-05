// src/pages/Guest/Cart.tsx
import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import { locationOutline, bicycleOutline, cardOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import CartItem from '../../components/Cart/CartItem';
import AuthRequiredModal from '../../components/Auth/AuthRequiredModal';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { fetchStallById } from '../../services/stallService';
import { getDeliveryFeeInfo } from '../../services/deliveryService';

const GuestCart: React.FC = () => {
  const history = useHistory();
  const { items, updateQuantity, removeFromCart, total } = useCart();
  const { user, isGuest } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [feeLoading, setFeeLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(2.99);
  const [serviceFee] = useState(1.49);
  const [rawDistance, setRawDistance] = useState<number | null>(null);
  const [chargedDistance, setChargedDistance] = useState<number>(0);

  useEffect(() => {
    if (isGuest) setShowAuthModal(true);
  }, [isGuest]);

  useEffect(() => {
    const calcFee = async () => {
      if (items.length === 0) return;
      setFeeLoading(true);
      try {
        const stallId = items[0]?.stallId || '';
        const stall = stallId ? await fetchStallById(stallId) : null;
        const custLocation = sessionStorage.getItem('selectedLocation');
        const sessionCoords = custLocation ? JSON.parse(custLocation) : null;
        const custLat = sessionCoords?.lat ?? user?.latitude;
        const custLng = sessionCoords?.lng ?? user?.longitude;
        const info = await getDeliveryFeeInfo(
          stall?.latitude, stall?.longitude,
          custLat, custLng
        );
        setDeliveryFee(info.fare);
        setRawDistance(info.distance_km);
        setChargedDistance(info.final_km);
      } catch { }
      setFeeLoading(false);
    };
    calcFee();
  }, [items]);

  const finalTotal = total + deliveryFee + serviceFee;

  const handleCheckout = () => {
    if (isGuest) {
      setShowAuthModal(true);
    } else {
      history.push('/login');
    }
  };

  return (
    <>

        <div className="flex flex-col min-h-full">
        <div className="w-full flex-1 flex flex-col pb-10 sm:pb-16 md:pt-8">
          {/* Page Title */}
          <div className="pt-1 sm:pt-2 pb-2 sm:pb-3">
            <h2 className="m-0 text-xl xs:text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--ion-text-color)]">
              Your Cart
            </h2>
          </div>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
              <div className="w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 rounded-full bg-[var(--ion-card-background)] border-2 border-[var(--ion-border-color)] flex items-center justify-center mb-6">
                <IonIcon icon={bicycleOutline} className="text-4xl sm:text-5xl text-[var(--ion-color-primary)]" />
              </div>
              <h2 className="m-0 mb-2 font-bold text-base sm:text-lg text-[var(--ion-text-color)]">Your cart is empty</h2>
              <p className="m-0 text-sm text-[var(--ion-text-color-secondary)]">Add some delicious food to get started!</p>
              <IonButton
                className="mt-6 min-h-[44px]"
                style={{ '--background': 'var(--ion-color-primary)', '--border-radius': '8px' }}
                onClick={() => history.push('/guest/home')}
              >
                Browse Stalls
              </IonButton>
            </div>
          ) : (
            <>
              {/* Delivery Address */}
              <div className="flex items-center gap-4 bg-[var(--ion-card-background)] mb-4 p-4 md:p-6 rounded-2xl border border-[var(--ion-border-color)]">
                <div className="w-10 h-10 rounded-full bg-[var(--ion-background-color)] border border-[var(--ion-border-color)] flex items-center justify-center shrink-0">
                  <IonIcon icon={locationOutline} className="text-[var(--ion-color-primary)] text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="m-0 mb-0.5 text-xs text-[var(--ion-text-color-secondary)]">Deliver to</p>
                  <p className="m-0 font-semibold text-sm sm:text-base text-[var(--ion-text-color)] truncate">{sessionStorage.getItem('locationName') || 'Current Location'}</p>
                </div>
                <IonButton fill="clear" className="shrink-0 min-h-[44px] text-sm" style={{ '--color': 'var(--ion-color-primary)' }} onClick={() => history.push('/guest/location')}>Change</IonButton>
              </div>

              {/* Cart Items */}
              <div className="space-y-3 sm:space-y-4">
                {items.map(item => (
                  <CartItem 
                    key={item.id} 
                    item={item}
                    onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                    onRemove={() => removeFromCart(item.id)}
                  />
                ))}
              </div>

              {/* Bill Details */}
              <div className="bg-[var(--ion-card-background)] mt-4 p-4 md:p-6 rounded-2xl border border-[var(--ion-border-color)]">
                <h3 className="m-0 mb-4 font-bold text-sm sm:text-base text-[var(--ion-text-color)]">Bill Details</h3>
                
                <div className="flex justify-between items-center py-2 text-xs sm:text-sm text-[var(--ion-text-color)]">
                  <span>Subtotal</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 text-xs sm:text-sm text-[var(--ion-text-color)]">
                  <span>Delivery Fee {rawDistance != null && <span className="text-[10px] text-[var(--ion-text-color-secondary)]">({rawDistance} km → {chargedDistance} km charged)</span>}</span>
                  <span>{feeLoading ? <IonSpinner className="inline-block" style={{ width: 14, height: 14 }} /> : `₱${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between items-center py-2 text-xs sm:text-sm text-[var(--ion-text-color)]">
                  <span>Service Fee</span>
                  <span>₱{serviceFee.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center pt-3 mt-2 border-t border-[var(--ion-border-color)] font-bold text-base sm:text-lg text-[var(--ion-text-color)]">
                  <span>Total</span>
                  <span className="text-[var(--ion-color-primary)]">₱{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {items.length > 0 && (
                <IonButton
                  expand="block" size="large"
                  className="mt-6 min-h-[48px] sm:min-h-[56px]"
                  style={{
                    '--background': 'var(--ion-color-primary)', '--border-radius': '8px',
                    fontSize: '15px', fontWeight: 700,
                  }}
                  onClick={handleCheckout}
                >
                  <IonIcon slot="start" icon={cardOutline} />
                  Proceed to Checkout • ₱{finalTotal.toFixed(2)}
                </IonButton>
              )}
            </>
          )}
        </div>

      </div>


      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default GuestCart;