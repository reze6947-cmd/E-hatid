import React, { useState, useEffect } from 'react';
import { IonCard, IonCardContent, IonIcon, IonButton } from '@ionic/react';
import { trendingUpOutline, cashOutline, cardOutline, walletOutline, alertCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { fetchOrdersByVendor, getEarningsStats } from '../../services/orderService';
import { Order } from '../../types';
import PageHeader from '../../components/ui/PageHeader';
import Skeleton from '../../components/ui/Skeleton';

const VendorEarnings: React.FC = () => {
  const history = useHistory();
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [financeCards, setFinanceCards] = useState([
    { icon: trendingUpOutline, label: 'Total Revenue', value: '₱0', change: '', color: 'var(--ion-color-primary)' },
    { icon: cashOutline, label: 'This Month', value: '₱0', change: '', color: '#10B981' },
    { icon: cardOutline, label: 'Pending Payout', value: '₱0', change: '', color: '#F59E0B' },
    { icon: walletOutline, label: 'Available Balance', value: '₱0', change: '', color: 'var(--ion-color-primary)' },
  ]);
  const [transactions, setTransactions] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const stats = await getEarningsStats(user.id);
        setFinanceCards([
          { icon: trendingUpOutline, label: 'Total Revenue', value: `₱${stats.totalRevenue.toLocaleString()}`, change: '', color: 'var(--ion-color-primary)' },
          { icon: cashOutline, label: 'This Month', value: `₱${stats.thisMonthRevenue.toLocaleString()}`, change: '', color: '#10B981' },
          { icon: cardOutline, label: 'Pending Payout', value: `₱${stats.pendingPayout.toLocaleString()}`, change: '', color: '#F59E0B' },
          { icon: walletOutline, label: 'Available Balance', value: `₱${stats.pendingPayout.toLocaleString()}`, change: '', color: 'var(--ion-color-primary)' },
        ]);
        const orders = await fetchOrdersByVendor(user.id);
        setTransactions(orders.filter(o => o.status === 'delivered'));
      } catch (err) {
        console.error('Error loading earnings:', err);
        setError('Could not load your earnings');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, retryKey]);

  const retryLoad = () => {
    setLoading(true);
    setError(null);
    setRetryKey(k => k + 1);
  };

  return (
    <>

        <div className="w-full flex-1 md:pt-8 pb-10 flex flex-col space-y-3 sm:space-y-4">
          <PageHeader title="Earnings" subtitle="Track your revenue and payouts" />

          {loading ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {[0, 1, 2, 3].map(i => (
                  <IonCard key={i} className="m-0 rounded-xl shadow">
                    <IonCardContent>
                      <div className="flex items-center gap-4">
                        <Skeleton variant="rectangular" width={48} height={48} className="rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton width="60%" height={12} />
                          <Skeleton width="40%" height={18} />
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>
              <div className="mt-4 space-y-3">
                {[0, 1, 2].map(i => (
                  <IonCard key={i} className="m-0 rounded-xl shadow">
                    <IonCardContent>
                      <div className="flex items-center justify-between mb-3">
                        <Skeleton width={80} height={14} />
                        <Skeleton width={60} height={16} className="rounded-full" />
                      </div>
                      <Skeleton width="45%" height={12} className="mb-2" />
                      <Skeleton width="35%" height={12} />
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>
            </>
          ) : error ? (
            <IonCard className="rounded-xl shadow">
              <IonCardContent>
                <div className="text-center py-8">
                  <IonIcon icon={alertCircleOutline} className="text-4xl text-[var(--ion-color-danger)] mb-3" />
                  <p className="text-sm font-semibold text-[var(--ion-text-color)] m-0 mb-1">Couldn't load your earnings</p>
                  <p className="text-sm text-[var(--ion-text-color-secondary)] m-0 mb-4">Check your connection and try again</p>
                  <IonButton fill="outline" shape="round" onClick={retryLoad}>Retry</IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {financeCards.map((card, i) => (
                  <IonCard key={i} className="m-0 rounded-xl shadow">
                    <IonCardContent>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${card.color}20` }}>
                          <IonIcon icon={card.icon} className="text-2xl" style={{ color: card.color }} />
                        </div>
                        <div>
                          <p className="m-0 mb-1 text-xs font-medium text-[var(--ion-text-color-secondary)]">{card.label}</p>
                          <h3 className="m-0 text-xl font-bold text-[var(--ion-text-color)]">{card.value}</h3>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>

              <div className="mt-4">
                <h3 className="m-0 mb-4 text-lg font-bold text-[var(--ion-text-color)]">Transaction History</h3>
                {transactions.length === 0 ? (
                  <IonCard className="rounded-xl shadow"><IonCardContent><p className="text-center text-[var(--ion-text-color-secondary)] m-0">No transactions yet</p></IonCardContent></IonCard>
                ) : (
                  <div className="grid gap-3">
                    {transactions.map((txn, i) => (
                      <IonCard key={i} className="m-0 rounded-xl shadow">
                        <IonCardContent>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-[var(--ion-color-primary)]">#{txn.id.slice(-5)}</span>
                            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                              txn.status === 'delivered' ? 'bg-[var(--ion-color-success)]/10 text-[var(--ion-color-success)]' : 'bg-[var(--ion-color-primary)]/10 text-[var(--ion-color-primary)]'
                            }`}>{txn.status === 'delivered' ? 'Paid' : txn.status}</span>
                          </div>
                          <p className="m-0 mb-2 text-sm text-[var(--ion-text-color)]">{txn.customerName || 'Unknown customer'}</p>
                          <p className="m-0 text-sm text-[var(--ion-text-color-secondary)]">{new Date(txn.createdAt).toLocaleString()}</p>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--ion-border-color)]">
                            <span className="text-xs font-medium text-[var(--ion-text-color-secondary)]">Amount</span>
                            <span className="text-base font-bold text-[var(--ion-text-color)]">₱{txn.total.toFixed(2)}</span>
                          </div>
                        </IonCardContent>
                      </IonCard>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

    </>
  );
};

export default VendorEarnings;
