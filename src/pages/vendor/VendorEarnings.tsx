import React, { useState, useEffect } from 'react';
import { IonCard, IonCardContent, IonIcon, IonSpinner } from '@ionic/react';
import { trendingUpOutline, cashOutline, cardOutline, walletOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { fetchOrdersByVendor, getEarningsStats } from '../../services/orderService';
import { Order } from '../../types';
import PageHeader from '../../components/ui/PageHeader';

const VendorEarnings: React.FC = () => {
  const history = useHistory();
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(true);
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
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  return (
    <>

        <div className="w-full flex-1 md:pt-8 pb-10 flex flex-col space-y-3 sm:space-y-4">
          <PageHeader title="Earnings" subtitle="Track your revenue and payouts" />

          {loading ? (
            <div className="text-center p-12"><IonSpinner /></div>
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
                  <IonCard className="rounded-xl shadow">
                    <div className="grid grid-cols-4 gap-4 p-4 bg-[var(--ion-color-light)] font-semibold text-sm text-[var(--ion-text-color-secondary)]">
                      <span>Order</span>
                      <span>Customer</span>
                      <span>Amount</span>
                      <span>Status</span>
                    </div>
                    {transactions.map((txn, i) => (
                      <div key={i} className="grid grid-cols-4 gap-4 p-4 text-sm text-[var(--ion-text-color)] border-t border-[var(--ion-border-color)]">
                        <span className="font-semibold text-[var(--ion-color-primary)]">#{txn.id.slice(-5)}</span>
                        <span>{txn.customerName || 'Unknown'}</span>
                        <span className="font-semibold">₱{txn.total.toFixed(2)}</span>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                          txn.status === 'delivered' ? 'bg-[var(--ion-color-success)]/10 text-[var(--ion-color-success)]' :
                          'bg-[var(--ion-color-primary)]/10 text-[var(--ion-color-primary)]'
                        }`}>{txn.status}</span>
                      </div>
                    ))}
                  </IonCard>
                )}
              </div>
            </>
          )}
        </div>

    </>
  );
};

export default VendorEarnings;
