import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonIcon,
  IonTextarea,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import { closeOutline, storefrontOutline, personOutline, checkmarkCircle } from 'ionicons/icons';
import { useAuth } from '../../context/AuthContext';
import { createReview, createRiderReview, hasReviewedOrder } from '../../services/reviewService';
import type { Order } from '../../types';
import StarRating from './StarRating';

interface ReviewModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ order, isOpen, onClose }) => {
  const { user } = useAuth();

  const [vendorRating, setVendorRating] = useState(5);
  const [vendorComment, setVendorComment] = useState('');
  const [riderRating, setRiderRating] = useState(5);
  const [riderComment, setRiderComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [checkingReviewed, setCheckingReviewed] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setVendorRating(5);
      setVendorComment('');
      setRiderRating(5);
      setRiderComment('');
      setSubmitting(false);
      setSubmitted(false);
      setToastMessage('');
      setAlreadyReviewed(false);
      if (order?.id) {
        setCheckingReviewed(true);
        hasReviewedOrder(order.id).then(already => {
          setAlreadyReviewed(already);
          setCheckingReviewed(false);
        });
      }
    }
  }, [isOpen, order?.id]);

  const handleSubmit = async () => {
    if (!user || !order) return;
    setSubmitting(true);
    try {
      if (await hasReviewedOrder(order.id)) {
        setAlreadyReviewed(true);
        setToastMessage("You've already reviewed this order");
        return;
      }
      await createReview({
        stallId: order.stallId,
        userId: user.id,
        orderId: order.id,
        userName: user.name || 'Anonymous',
        rating: vendorRating,
        comment: vendorComment,
      });
      if (order.riderId) {
        await createRiderReview({
          riderId: order.riderId,
          userId: user.id,
          orderId: order.id,
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

  if (!isOpen || !order) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-full max-w-[480px] rounded-2xl bg-[var(--ion-card-background)] border border-[var(--ion-border-color)] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ion-border-color)]">
          <h2 className="m-0 text-base font-bold text-[var(--ion-text-color)]">Leave a Review</h2>
          <IonButton fill="clear" onClick={onClose} aria-label="Close review" style={{ '--padding-start': '0', '--padding-end': '0', width: '36px', height: '36px' }}>
            <IonIcon icon={closeOutline} className="text-lg text-[var(--ion-text-color-secondary)]" />
          </IonButton>
        </div>

        <div className="p-4 max-h-[75vh] overflow-y-auto">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <IonIcon icon={checkmarkCircle} className="text-5xl text-[#10B981] mb-4" />
              <h2 className="m-0 mb-2 text-xl font-bold text-[var(--ion-text-color)]">Thank you for your review!</h2>
              <p className="m-0 mb-4 text-sm text-[var(--ion-text-color-secondary)]">Your feedback helps us improve</p>
              <IonButton shape="round" onClick={onClose}>
                Close
              </IonButton>
            </div>
          ) : checkingReviewed ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <IonSpinner />
              <p className="m-0 mt-3 text-sm text-[var(--ion-text-color-secondary)]">Checking your review status...</p>
            </div>
          ) : alreadyReviewed ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <IonIcon icon={checkmarkCircle} className="text-5xl text-[#10B981] mb-4" />
              <h2 className="m-0 mb-2 text-xl font-bold text-[var(--ion-text-color)]">You've already reviewed this order</h2>
              <p className="m-0 mb-4 text-sm text-[var(--ion-text-color-secondary)]">Thanks for your feedback!</p>
              <IonButton shape="round" onClick={onClose}>
                Close
              </IonButton>
            </div>
          ) : (
            <>
              {/* Order Summary */}
              <div className="mb-3 bg-[var(--ion-background-color)] rounded-2xl p-3 border border-[var(--ion-border-color)]">
                <div className="flex items-center gap-2 mb-1">
                  <IonIcon icon={storefrontOutline} className="text-[var(--ion-color-primary)]" />
                  <span className="font-semibold text-sm text-[var(--ion-text-color)]">{order.stallName || 'Stall'}</span>
                </div>
                <p className="m-0 text-xs text-[var(--ion-text-color-secondary)]">
                  {order.items.length} item(s) &middot; ₱{order.total.toFixed(2)}
                </p>
              </div>

              {/* Rate Vendor */}
              <div className="mb-3 bg-[var(--ion-background-color)] rounded-2xl p-3 border border-[var(--ion-border-color)]">
                <div className="flex items-center gap-2 mb-3">
                  <IonIcon icon={storefrontOutline} className="text-[#8B5CF6]" />
                  <p className="m-0 text-sm font-bold text-[var(--ion-text-color)]">Rate the Vendor</p>
                </div>
                <StarRating value={vendorRating} onChange={setVendorRating} />
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
                <div className="mb-3 bg-[var(--ion-background-color)] rounded-2xl p-3 border border-[var(--ion-border-color)]">
                  <div className="flex items-center gap-2 mb-3">
                    <IonIcon icon={personOutline} className="text-[#10B981]" />
                    <p className="m-0 text-sm font-bold text-[var(--ion-text-color)]">Rate the Rider</p>
                  </div>
                  <StarRating value={riderRating} onChange={setRiderRating} />
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
            </>
          )}
        </div>
      </div>

      <IonToast
        isOpen={!!toastMessage}
        message={toastMessage}
        duration={2000}
        onDidDismiss={() => setToastMessage('')}
        position="bottom"
      />
    </>
  );
};

export default ReviewModal;
