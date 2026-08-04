import React from 'react';
import {
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonButton,
} from '@ionic/react';
import { cashOutline, trendingUpOutline, downloadOutline } from 'ionicons/icons';

import { useAuth } from '../../context/AuthContext';
import { useRiderEarnings } from '../../hooks/useRiderEarnings';
import RiderPageHeader from '../../components/Rider/RiderPageHeader';
import EmptyState from '../../components/Rider/EmptyState';
import Skeleton from '../../components/ui/Skeleton';

const RiderEarnings: React.FC = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = React.useState('today');
  const earnings = useRiderEarnings(user?.id);

  const periodTotal = selectedPeriod === 'today' ? earnings.todayTotal
    : selectedPeriod === 'week' ? earnings.weekTotal
    : earnings.monthTotal;

  const periodTrips = selectedPeriod === 'today' ? earnings.todayTrips
    : selectedPeriod === 'week' ? earnings.weekTrips
    : earnings.monthTrips;

  const avgPerTrip = periodTrips > 0 ? periodTotal / periodTrips : 0;
  const maxEarning = Math.max(...earnings.weeklyBreakdown.map(d => d.amount), 1);

  return (
    <div className="w-full flex-1 md:pt-8 pb-10 flex flex-col space-y-3 sm:space-y-4">
      <RiderPageHeader title="Earnings" subtitle="Track your delivery income" />

      {/* Period Selection */}
      <div>
        <IonSegment
          value={selectedPeriod}
          onIonChange={e => setSelectedPeriod(e.detail.value as string)}
          style={{ '--background': 'var(--ion-border-color)' }}
        >
          <IonSegmentButton value="today" style={{ '--color-checked': '#FFFFFF', '--border-radius': '12px', '--indicator-color': 'var(--ion-color-primary)' }}>
            <IonLabel className="text-xs">Today</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="week" style={{ '--color-checked': '#FFFFFF', '--border-radius': '12px', '--indicator-color': 'var(--ion-color-primary)' }}>
            <IonLabel className="text-xs">Week</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="month" style={{ '--color-checked': '#FFFFFF', '--border-radius': '12px', '--indicator-color': 'var(--ion-color-primary)' }}>
            <IonLabel className="text-xs">Month</IonLabel>
          </IonSegmentButton>
        </IonSegment>
      </div>

      {/* Total Earnings Hero */}
      {earnings.loading ? (
        <div>
          <div className="rounded-2xl p-6 text-center bg-[var(--ion-card-background)] border border-[var(--ion-border-color)]">
            <Skeleton width={110} height={14} className="mx-auto mb-3" />
            <Skeleton width={160} height={36} className="mx-auto mb-3" />
            <Skeleton width={140} height={12} className="mx-auto" />
          </div>
        </div>
      ) : (
        <div>
          <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>
            <p className="m-0 mb-2 text-sm text-white/90">Total Earnings</p>
            <h2 className="m-0 text-4xl font-bold text-white">₱{periodTotal.toFixed(2)}</h2>
            <p className="m-0 mt-3 text-xs text-white/80">
              {periodTrips} trips · Avg: ₱{avgPerTrip.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div>
        {earnings.loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map(i => (
              <div key={i} className="rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] p-4">
                <div className="flex items-center gap-3">
                  <Skeleton variant="circular" width={40} height={40} />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="55%" height={12} />
                    <Skeleton width="40%" height={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                  <IonIcon icon={cashOutline} className="text-xl" style={{ color: 'var(--ion-color-primary)' }} />
                </div>
                <div>
                  <p className="m-0 text-xs text-[var(--ion-text-color-secondary)]">Trips</p>
                  <h4 className="m-0 mt-1 font-bold text-[var(--ion-text-color)]">{periodTrips}</h4>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                  <IonIcon icon={trendingUpOutline} className="text-xl" style={{ color: '#10B981' }} />
                </div>
                <div>
                  <p className="m-0 text-xs text-[var(--ion-text-color-secondary)]">Average</p>
                  <h4 className="m-0 mt-1 font-bold text-[var(--ion-text-color)]">₱{avgPerTrip.toFixed(2)}</h4>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weekly Chart */}
      {selectedPeriod !== 'month' && (
        <div>
          <h3 className="m-0 mb-3 text-xs font-bold uppercase tracking-wide text-[var(--ion-text-color-secondary)]">
            Weekly Breakdown
          </h3>
          {earnings.weeklyBreakdown.length === 0 || earnings.weekTotal === 0 ? (
            <EmptyState
              icon={cashOutline}
              title="No earnings yet"
              subtitle="Complete deliveries to see your weekly breakdown"
            />
          ) : (
            <div className="rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] p-4">
              <div className="flex items-end justify-around h-[150px] gap-2">
                {earnings.weeklyBreakdown.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center justify-end text-center">
                    <div
                      className="w-full rounded-t-lg transition-all"
                      style={{
                        height: `${Math.max((day.amount / maxEarning) * 100, 4)}%`,
                        background: 'linear-gradient(180deg, #6D28D9, #8B5CF6)',
                        minHeight: 20,
                      }}
                    />
                    <p className="m-0 mt-2 text-[11px] text-[var(--ion-text-color-secondary)]">{day.day}</p>
                    <p className="m-0 mt-0.5 text-[10px] text-[var(--ion-text-color-secondary)]">₱{day.amount.toFixed(0)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Download Statement */}
      <div>
        <IonButton
          expand="block"
          fill="outline"
          disabled
          style={{ '--border-color': 'var(--ion-color-primary)', '--color': 'var(--ion-color-primary)', margin: 0 }}
          title="Coming soon"
        >
          <IonIcon slot="start" icon={downloadOutline} />
          Download Statement
        </IonButton>
        <p className="m-0 mt-1 text-center text-[10px] text-[var(--ion-text-color-secondary)]">Coming soon</p>
      </div>
    </div>
  );
};

export default RiderEarnings;
