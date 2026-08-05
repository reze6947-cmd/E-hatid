import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { star, starOutline, alertCircleOutline } from 'ionicons/icons';

import { useAuth } from '../../context/AuthContext';
import { fetchRiderReviews, getRiderReviewStats } from '../../services/reviewService';
import { Review } from '../../types';
import RiderPageHeader from '../../components/Rider/RiderPageHeader';
import PageLoader from '../../components/PageLoader';

const formatDate = (d: string | Date | any) => {
  if (!d) return '';
  if (typeof d?.toDate === 'function') d = d.toDate();
  const date = typeof d === 'string' ? new Date(d) : d;
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};

const RiderReviews: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [total, setTotal] = useState(0);
  const [distribution, setDistribution] = useState<number[]>([0, 0, 0, 0, 0]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [stats, allReviews] = await Promise.all([
          getRiderReviewStats(user.id),
          fetchRiderReviews(user.id),
        ]);
        if (cancelled) return;
        setRating(stats.average);
        setTotal(stats.total);
        setDistribution(stats.distribution);
        setReviews(allReviews);
      } catch (err) {
        console.error('Error loading rider reviews:', err);
        if (!cancelled) setError('Could not load your reviews');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) {
    return <PageLoader message="Loading your reviews..." />;
  }

  return (
    <div className="w-full flex-1 md:pt-8 pb-10 flex flex-col space-y-3 sm:space-y-4">
      <RiderPageHeader title="Reviews" subtitle="See what customers say about your deliveries" />

      {error ? (
        <div className="rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] p-8 text-center">
          <IonIcon icon={alertCircleOutline} className="text-4xl text-[var(--ion-color-danger)] mb-3" />
          <p className="text-sm font-semibold text-[var(--ion-text-color)] m-0 mb-1">Couldn't load your reviews</p>
          <p className="text-sm text-[var(--ion-text-color-secondary)] m-0">Check your connection and try again</p>
        </div>
      ) : (
        <>
          {/* Rating Summary */}
          <div className="rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] p-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="flex flex-col items-center sm:items-start sm:min-w-[120px]">
                <div className="text-4xl font-extrabold text-[var(--ion-color-primary)]">
                  {total > 0 ? rating.toFixed(1) : '—'}
                </div>
                <div className="flex gap-0.5 my-1.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <IonIcon key={s} icon={s <= Math.round(rating) ? star : starOutline} className="text-xl" style={{ color: '#F59E0B' }} />
                  ))}
                </div>
                <p className="m-0 text-sm text-[var(--ion-text-color-secondary)]">{total} review{total !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex-1">
                {[5, 4, 3, 2, 1].map((stars, i) => (
                  <div key={i} className="flex items-center gap-3 mb-2">
                    <span className="text-sm min-w-[40px] text-[var(--ion-text-color)]">{stars} ★</span>
                    <div className="flex-1 h-2 bg-[var(--ion-border-color)] rounded-full overflow-hidden">
                      <div style={{ width: total > 0 ? `${(distribution[5 - stars] / total) * 100}%` : '0%', height: '100%', background: '#F59E0B', borderRadius: '4px' }} />
                    </div>
                    <span className="text-xs min-w-[30px] text-[var(--ion-text-color-secondary)]">{distribution[5 - stars]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] p-8 text-center">
              <IonIcon icon={starOutline} className="text-3xl text-[var(--ion-text-color-secondary)] mb-2" />
              <p className="m-0 text-sm text-[var(--ion-text-color-secondary)]">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {reviews.map((review, i) => (
                <div key={review.id || i} className="rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="m-0 mb-1 font-bold text-[var(--ion-text-color)]">{review.userName}</h3>
                    <span className="text-xs text-[var(--ion-text-color-secondary)]">{formatDate(review.date)}</span>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <IonIcon key={s} icon={s <= review.rating ? star : starOutline} className="text-sm" style={{ color: '#F59E0B' }} />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="m-0 text-sm text-[var(--ion-text-color)] leading-relaxed">{review.comment}</p>
                  )}
                  {review.orderId && (
                    <p className="m-0 mt-2 text-xs text-[var(--ion-text-color-secondary)]">Order #{String(review.orderId).slice(-6).toUpperCase()}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RiderReviews;
