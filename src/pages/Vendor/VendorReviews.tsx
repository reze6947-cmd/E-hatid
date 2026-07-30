import React, { useState, useEffect } from 'react';
import { IonCard, IonCardContent, IonIcon, IonSpinner } from '@ionic/react';
import { star, starOutline, thumbsUp } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { fetchReviewsByStall, getReviewStats } from '../../services/reviewService';
import { getStallByVendorId } from '../../services/stallService';
import { Review } from '../../types';
import PageHeader from '../../components/ui/PageHeader';

const VendorReviews: React.FC = () => {
  const history = useHistory();
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stallId, setStallId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [total, setTotal] = useState(0);
  const [distribution, setDistribution] = useState<number[]>([0, 0, 0, 0, 0]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const stall = await getStallByVendorId(user.id);
        if (stall) {
          setStallId(stall.id);
          const [stats, allReviews] = await Promise.all([
            getReviewStats(stall.id),
            fetchReviewsByStall(stall.id),
          ]);
          setRating(stats.average);
          setTotal(stats.total);
          setDistribution(stats.distribution);
          setReviews(allReviews);
        }
      } catch (err) {
        console.error('Error loading reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  return (
    <>

        <div className="p-4">
          <PageHeader title="Reviews" subtitle="See what your customers are saying" />

          {loading ? (
            <div className="text-center p-12"><IonSpinner /></div>
          ) : (
            <>
              <IonCard className="rounded-xl shadow mb-4">
                <IonCardContent>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex flex-col items-center">
                      <div className="text-5xl font-extrabold text-[var(--ion-color-primary)]">{total > 0 ? rating : '—'}</div>
                      <div className="flex gap-1 my-2">
                        {[1,2,3,4,5].map(s => (
                          <IonIcon key={s} icon={s <= Math.round(rating) ? star : starOutline} className="text-xl" style={{ color: '#F59E0B' }} />
                        ))}
                      </div>
                      <p className="m-0 text-sm text-[var(--ion-text-color-secondary)]">{total} reviews</p>
                    </div>
                    <div className="flex-1">
                      {[5,4,3,2,1].map((stars, i) => (
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
                </IonCardContent>
              </IonCard>

              {reviews.length === 0 ? (
                <IonCard className="rounded-xl shadow"><IonCardContent><p className="text-center text-[var(--ion-text-color-secondary)] m-0">No reviews yet</p></IonCardContent></IonCard>
              ) : (
                <div className="grid gap-4">
                  {reviews.map((review, i) => (
                    <IonCard key={i} className="rounded-xl shadow" style={{ margin: 0 }}>
                      <IonCardContent>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="m-0 mb-1 font-bold text-[var(--ion-text-color)]">{review.userName}</h3>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => (
                                  <IonIcon key={s} icon={s <= review.rating ? star : starOutline} className="text-sm" style={{ color: '#F59E0B' }} />
                                ))}
                              </div>
                              <span className="text-xs text-[var(--ion-text-color-secondary)]">{review.date}</span>
                            </div>
                          </div>
                        </div>
                        <p className="my-3 text-sm text-[var(--ion-text-color)] leading-relaxed">{review.comment}</p>
                        <div className="flex gap-4 text-xs text-[var(--ion-text-color-secondary)]">
                          <span className="flex items-center gap-1">
                            <IonIcon icon={thumbsUp} /> {review.likes}
                          </span>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

    </>
  );
};

export default VendorReviews;
