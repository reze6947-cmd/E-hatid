import React, { useState } from 'react';
import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonToast,
  IonTextarea,
} from '@ionic/react';
import { star, starOutline, storefrontOutline, personOutline, checkmarkCircle } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { createReview } from '../../services/reviewService';
import { createRiderReview } from '../../services/reviewService';
import type { Order } from '../../types';

const ReviewPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{ order?: Order }>();
  const { user } = useAuth();
  const order = location.state?.order;

  const [vendorRating, setVendorRating] = useState(5);
  const [vendorComment, setVendorComment] = useState('');
  const [riderRating, setRiderRating] = useState(5);
  const [riderComment, setRiderComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <p className="text-[var(--ion-text-color-secondary)]">Order not found</p>
        <IonButton shape="round" onClick={() => history.push('/customer/orders')}>
          Go to Orders
        </IonButton>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await createReview({
        stallId: order.stallId,
        userId: user.id,
        userName: user.name || 'Anonymous',
        rating: vendorRating,
        comment: vendorComment,
      });
      if (order.riderId) {
        await createRiderReview({
          riderId: order.riderId,
          userId: user.id,
          userName: user.name || 'Anonymous',
          rating: riderRating,
          comment: riderComment,
        });
      }
      setSubmitted(true);
      setToastMessage('Review submitted!');
    } catch (err) {
      console.error('Failed to submit review:', err);
      setToastMessage('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <IonIcon icon={checkmarkCircle} className="text-5xl text-[#10B981] mb-4" />
        <h2 className="m-0 mb-2 text-xl font-bold text-[var(--ion-text-color)]">Thank you for your review!</h2>
        <p className="m-0 mb-4 text-sm text-[var(--ion-text-color-secondary)]">Your feedback helps us improve</p>
        <IonButton shape="round" onClick={() => history.push('/customer/orders')}>
          Back to Orders
        </IonButton>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex-1 md:pt-8">
      <div className="page-container flex-1 pt-6 pb-10">
        <h2 className="m-0 mb-4 text-2xl font-bold text-[var(--ion-text-color)] text-center">Leave a Review</h2>

        {/* Order Summary */}
        <div className="max-w-[360px] mx-auto mb-4 bg-[var(--ion-card-background)] rounded-2xl p-4 border border-[var(--ion-border-color)]">
          <div className="flex items-center gap-2 mb-2">
            <IonIcon icon={storefrontOutline} className="text-[var(--ion-color-primary)]" />
            <span className="font-semibold text-sm text-[var(--ion-text-color)]">{order.stallName || 'Stall'}</span>
          </div>
          <p className="m-0 text-xs text-[var(--ion-text-color-secondary)]">
            {order.items.length} item(s) &middot; ₱{order.total.toFixed(2)}
          </p>
        </div>

        {/* Rate Vendor */}
        <div className="max-w-[360px] mx-auto mb-4 bg-[var(--ion-card-background)] rounded-2xl p-4 border border-[var(--ion-border-color)]">
          <div className="flex items-center gap-2 mb-3">
            <IonIcon icon={storefrontOutline} className="text-[#8B5CF6]" />
            <p className="m-0 text-sm font-bold text-[var(--ion-text-color)]">Rate the Vendor</p>
          </div>
          <div className="flex justify-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(starVal => (
              <button
                key={starVal}
                onClick={() => setVendorRating(starVal)}
                className="bg-transparent border-none cursor-pointer p-1 text-2xl transition-transform hover:scale-110"
              >
                <IonIcon
                  icon={starVal <= vendorRating ? star : starOutline}
                  style={{ color: starVal <= vendorRating ? '#F59E0B' : 'var(--ion-text-color-secondary)' }}
                />
              </button>
            ))}
          </div>
          <IonTextarea
            value={vendorComment}
            onIonChange={e => setVendorComment(e.detail.value || '')}
            placeholder="How was the food and service? (optional)"
            className="w-full p-3 rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-background-color)] text-sm text-[var(--ion-text-color)]"
            rows={3}
            autoGrow
          />
        </div>

        {/* Rate Rider */}
        {order.riderId && (
          <div className="max-w-[360px] mx-auto mb-4 bg-[var(--ion-card-background)] rounded-2xl p-4 border border-[var(--ion-border-color)]">
            <div className="flex items-center gap-2 mb-3">
              <IonIcon icon={personOutline} className="text-[#10B981]" />
              <p className="m-0 text-sm font-bold text-[var(--ion-text-color)]">Rate the Rider</p>
            </div>
            <div className="flex justify-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map(starVal => (
                <button
                  key={starVal}
                  onClick={() => setRiderRating(starVal)}
                  className="bg-transparent border-none cursor-pointer p-1 text-2xl transition-transform hover:scale-110"
                >
                  <IonIcon
                    icon={starVal <= riderRating ? star : starOutline}
                    style={{ color: starVal <= riderRating ? '#F59E0B' : 'var(--ion-text-color-secondary)' }}
                  />
                </button>
              ))}
            </div>
            <IonTextarea
              value={riderComment}
              onIonChange={e => setRiderComment(e.detail.value || '')}
              placeholder="How was the delivery? (optional)"
              className="w-full p-3 rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-background-color)] text-sm text-[var(--ion-text-color)]"
              rows={3}
              autoGrow
            />
          </div>
        )}

        <div className="max-w-[360px] mx-auto">
          <IonButton
            expand="block"
            shape="round"
            color="secondary"
            className="min-h-[44px] font-semibold"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <IonSpinner /> : 'Submit Review'}
          </IonButton>
        </div>
      </div>

      <IonToast
        isOpen={!!toastMessage}
        message={toastMessage}
        duration={2000}
        onDidDismiss={() => setToastMessage('')}
        position="bottom"
      />
    </div>
  );
};

export default ReviewPage;
