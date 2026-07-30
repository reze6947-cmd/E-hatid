import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IonContent, IonCard, IonCardContent, IonIcon, IonButton, IonSpinner, IonModal, IonHeader, IonToolbar, IonButtons, IonTitle, IonTextarea, IonToast } from '@ionic/react';
import { trendingUpOutline, cartOutline, starOutline, peopleOutline, storefrontOutline, cashOutline, personOutline, clipboardOutline, checkmarkOutline, closeOutline, locationOutline, callOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { getEarningsStats, updateOrderStatus, subscribeVendorOrders } from '../../services/orderService';
import { getReviewStats } from '../../services/reviewService';
import { getStallByVendorId } from '../../services/stallService';
import { useOrders } from '../../context/OrderContext';
import { Order } from '../../types';
import PageHeader from '../../components/ui/PageHeader';

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  pending: { color: '#F59E0B', label: 'Pending' },
  accepted: { color: '#3B82F6', label: 'Accepted' },
  preparing: { color: '#7C3AED', label: 'Preparing' },
  ready: { color: '#10B981', label: 'Ready' },
  delivering: { color: '#8B5CF6', label: 'Delivering' },
  delivered: { color: '#10B981', label: 'Delivered' },
  cancelled: { color: '#EF4444', label: 'Cancelled' },
};

const badgestyle = (status: string): React.CSSProperties => {
  const c = STATUS_BADGE[status]?.color || '#9CA3AF';
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: 9999,
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: c + '1A',
    color: c,
    border: '1px solid ' + c + '30',
  };
};

const VendorDashboard: React.FC = () => {
  const history = useHistory();
  const { logout, user } = useAuth();
  const { updateOrderStatus: localUpdateStatus } = useOrders();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { icon: trendingUpOutline, label: 'Total Sales', value: '₱0', color: 'var(--ion-color-primary)' },
    { icon: cartOutline, label: 'Orders Today', value: '0', color: '#10B981' },
    { icon: starOutline, label: 'Average Rating', value: '0.0', color: '#F59E0B' },
    { icon: peopleOutline, label: 'Total Customers', value: '0', color: 'var(--ion-color-primary)' },
  ]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineOrderId, setDeclineOrderId] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);

  const quickLinks = [
    { label: 'Products', icon: storefrontOutline, route: '/vendor/products', color: 'var(--ion-color-primary)' },
    { label: 'Orders', icon: clipboardOutline, route: '/vendor/orders', color: '#10B981' },
    { label: 'Earnings', icon: cashOutline, route: '/vendor/earnings', color: '#F59E0B' },
    { label: 'Reviews', icon: starOutline, route: '/vendor/reviews', color: '#EC4899' },
    { label: 'Profile', icon: personOutline, route: '/vendor/profile', color: '#14B8A6' },
  ];

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      const [earnings, stall] = await Promise.all([
        getEarningsStats(user.id),
        getStallByVendorId(user.id),
      ]);
      const reviews = stall ? await getReviewStats(stall.id) : { average: 0, total: 0, distribution: [0,0,0,0,0] };
      setStats(prev => [
        { ...prev[0], value: `₱${earnings.totalRevenue.toLocaleString()}` },
        { ...prev[1], value: String(earnings.ordersToday ?? 0) },
        { ...prev[2], value: String(reviews.average) },
        { ...prev[3], value: String(earnings.totalCustomers) },
      ]);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeVendorOrders(user.id, (orders) => {
      setRecentOrders(orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').slice(0, 3));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const ordersToday = orders.filter(o => {
        const d = new Date(o.createdAt);
        return d >= today;
      }).length;

      setStats(prev => {
        const next = [...prev];
        next[1] = { ...next[1], value: String(ordersToday) };
        return next;
      });

      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleAccept = async (order: Order) => {
    setProcessingOrders(prev => new Set(prev).add(order.id));
    try {
      await updateOrderStatus(order.id, { status: 'accepted' });
      localUpdateStatus(order.id, 'accepted');
      setRecentOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'accepted' } : o));
    } catch {
      setToastMessage('Failed to accept order');
      setShowToast(true);
    } finally {
      setProcessingOrders(prev => { const s = new Set(prev); s.delete(order.id); return s; });
    }
  };

  const openDeclineModal = (orderId: string) => {
    setDeclineOrderId(orderId);
    setDeclineReason('');
    setDeclineModalOpen(true);
  };

  const confirmDecline = async () => {
    if (!declineOrderId) return;
    setProcessingOrders(prev => new Set(prev).add(declineOrderId));
    try {
      const reason = declineReason.trim() || 'Order cancelled by vendor';
      await updateOrderStatus(declineOrderId, { status: 'cancelled', cancelledReason: reason });
      localUpdateStatus(declineOrderId, 'cancelled');
      setRecentOrders(prev => prev.map(o => o.id === declineOrderId ? { ...o, status: 'cancelled', cancelledReason: reason } : o));
    } catch {
      setToastMessage('Failed to decline order');
      setShowToast(true);
    } finally {
      setProcessingOrders(prev => { const s = new Set(prev); s.delete(declineOrderId); return s; });
      setDeclineModalOpen(false);
    }
  };

  const isProcessing = (id: string) => processingOrders.has(id);

  return (
    <>

        <div className="p-4 space-y-4">
          <div>
            <PageHeader title="Dashboard" subtitle="Overview of your stall's performance" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {stats.map((stat, i) => (
                <IonCard key={i} className="rounded-xl shadow" style={{ borderTop: `4px solid ${stat.color}` }}>
                  <IonCardContent>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg" style={{ background: `${stat.color}20`, color: stat.color }}>
                        <IonIcon icon={stat.icon} />
                      </div>
                      <div>
                        <p className="text-sm text-[var(--ion-text-color-secondary)]">{stat.label}</p>
                        <h3 className="text-xl font-bold text-[var(--ion-text-color)]">{loading ? '...' : stat.value}</h3>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[var(--ion-text-color)]">Quick Links</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {quickLinks.map((link, i) => (
                <IonCard key={i} button onClick={() => history.push(link.route)}
                  className="m-0 rounded-xl hover:shadow-lg transition-shadow duration-200" style={{ borderTop: `3px solid ${link.color}` }}>
                  <IonCardContent className="text-center p-4">
                    <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: `${link.color}20` }}>
                      <IonIcon icon={link.icon} className="text-xl" style={{ color: link.color }} />
                    </div>
                    <p className="m-0 text-sm font-semibold text-[var(--ion-text-color)]">{link.label}</p>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[var(--ion-text-color)]">Recent Orders</h2>
              <IonButton fill="clear" color="primary" onClick={() => history.push('/vendor/orders')}>
                View All
              </IonButton>
            </div>
            {loading ? (
              <div className="text-center p-8"><IonSpinner /></div>
            ) : recentOrders.length === 0 ? (
              <IonCard className="rounded-xl shadow"><IonCardContent><p className="text-center text-[var(--ion-text-color-secondary)] m-0">You don't have any orders yet</p></IonCardContent></IonCard>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {recentOrders.map(order => (
                  <IonCard key={order.id} className="rounded-xl shadow" style={{ cursor: 'pointer' }} onClick={() => setDetailsOrder(order)}>
                    <IonCardContent>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <h3 className="m-0 mb-1 font-bold text-[var(--ion-text-color)]">#{order.id.slice(-5)}</h3>
                          <p className="m-0 text-sm text-[var(--ion-text-color-secondary)]">{order.customerName || 'Unknown'}{order.customerPhone ? ` · ${order.customerPhone}` : ''}</p>
                        </div>
                        <span style={badgestyle(order.status)}>{STATUS_BADGE[order.status]?.label || order.status}</span>
                      </div>

                      <div className="p-3 bg-[var(--ion-background-color)] rounded-lg mb-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm" style={{ marginBottom: i < order.items.length - 1 ? '8px' : 0 }}>
                            <span className="text-[var(--ion-text-color)] flex-1">{item.name}</span>
                            <span className="text-[var(--ion-text-color-secondary)]">x{item.quantity}</span>
                          </div>
                        ))}
                        <div className="border-t border-[var(--ion-border-color)] mt-2 pt-2 flex justify-between">
                          <span className="font-semibold text-[var(--ion-text-color)]">Total</span>
                          <span className="font-bold text-[var(--ion-color-primary)]">₱{(order.total - (order.deliveryFee || 0)).toFixed(2)}</span>
                        </div>
                      </div>

                      {order.status === 'pending' && (
                        <div className="flex gap-2">
                          <IonButton
                            className="flex-1"
                            color="success"
                            disabled={isProcessing(order.id)}
                            onClick={(e) => { e.stopPropagation(); handleAccept(order); }}
                          >
                            {isProcessing(order.id) ? <IonSpinner /> : <IonIcon icon={checkmarkOutline} slot="start" />}
                            Accept
                          </IonButton>
                          <IonButton
                            className="flex-1"
                            color="danger"
                            disabled={isProcessing(order.id)}
                            onClick={(e) => { e.stopPropagation(); openDeclineModal(order.id); }}
                          >
                            {isProcessing(order.id) ? <IonSpinner /> : <IonIcon icon={closeOutline} slot="start" />}
                            Decline
                          </IonButton>
                        </div>
                      )}
                      {(order.status === 'accepted' || order.status === 'preparing') && (
                        <div className="flex gap-2">
                          <IonButton
                            expand="block"
                            color="primary"
                            disabled={isProcessing(order.id)}
                            onClick={async (e) => {
                              e.stopPropagation();
                              setProcessingOrders(prev => new Set(prev).add(order.id));
                              try {
                                await updateOrderStatus(order.id, { status: 'ready' });
                                localUpdateStatus(order.id, 'ready');
                                setRecentOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'ready' } : o));
                              } catch {
                                setToastMessage('Failed to mark order as ready');
                                setShowToast(true);
                              } finally {
                                setProcessingOrders(prev => { const s = new Set(prev); s.delete(order.id); return s; });
                              }
                            }}
                          >
                            {isProcessing(order.id) ? <IonSpinner /> : <IonIcon icon={checkmarkOutline} slot="start" />}
                            Mark as Ready
                          </IonButton>
                        </div>
                      )}
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>
            )}
          </div>
        </div>


      <IonModal isOpen={declineModalOpen} onDidDismiss={() => setDeclineModalOpen(false)}>
        <IonHeader className="ion-no-border">
          <IonToolbar style={{ '--background': 'var(--ion-card-background)' }}>
            <IonButtons slot="start">
              <IonButton onClick={() => setDeclineModalOpen(false)}>Cancel</IonButton>
            </IonButtons>
            <IonTitle>Decline Order</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={confirmDecline} color="danger" className="font-bold">Confirm</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'var(--ion-background-color)' }}>
          <div style={{ padding: '24px' }}>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--ion-text-color-secondary)' }}>
              Why are you declining this order? The reason will be shown to the customer.
            </p>
            <IonTextarea
              value={declineReason}
              onIonChange={e => setDeclineReason(e.detail.value!)}
              placeholder="e.g. User doesn't have proper details of their account"
              rows={4}
              style={{ '--background': 'var(--ion-item-background)', borderRadius: '8px', padding: '8px' } as any}
            />
          </div>
        </IonContent>
      </IonModal>

      <IonModal isOpen={!!detailsOrder} onDidDismiss={() => setDetailsOrder(null)}>
        <IonHeader className="ion-no-border">
          <IonToolbar style={{ '--background': 'var(--ion-card-background)' }}>
            <IonButtons slot="start">
              <IonButton onClick={() => setDetailsOrder(null)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle>Order Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'var(--ion-background-color)' }}>
          {detailsOrder && (
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--ion-border-color)' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--ion-text-color)' }}>#{detailsOrder.id.slice(-5)}</h2>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--ion-text-color-secondary)' }}>{new Date(detailsOrder.createdAt).toLocaleString()}</p>
                </div>
                <span style={badgestyle(detailsOrder.status)}>{STATUS_BADGE[detailsOrder.status]?.label || detailsOrder.status}</span>
              </div>

              {(detailsOrder.customerName || detailsOrder.customerPhone || detailsOrder.deliveryAddress) && (
                <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--ion-border-color)' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--ion-text-color-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    <IonIcon icon={personOutline} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    Customer
                  </p>
                  <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 600, color: 'var(--ion-text-color)' }}>{detailsOrder.customerName}</p>
                  {detailsOrder.customerPhone && (
                    <p style={{ margin: '0 0 2px', fontSize: '13px', color: 'var(--ion-text-color-secondary)' }}>
                      <IonIcon icon={callOutline} style={{ verticalAlign: 'middle', marginRight: '4px', fontSize: '13px' }} />
                      {detailsOrder.customerPhone}
                    </p>
                  )}
                  {detailsOrder.deliveryAddress && (
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--ion-text-color-secondary)' }}>
                      <IonIcon icon={locationOutline} style={{ verticalAlign: 'middle', marginRight: '4px', fontSize: '13px' }} />
                      {detailsOrder.deliveryAddress}
                    </p>
                  )}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--ion-text-color-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Items</p>
                {detailsOrder.items.map((item, i) => {
                  const optionsTotal = item.selectedOptions?.reduce((s, o) => s + o.choicePrice, 0) || 0;
                  const addonsTotal = item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0;
                  const basePrice = item.price - optionsTotal - addonsTotal;
                  const qty = item.quantity;
                  return (
                    <div key={i} style={{ padding: '12px', background: 'var(--ion-card-background)', borderRadius: '10px', marginBottom: '8px', border: '1px solid var(--ion-border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ion-text-color)', flex: 1 }}>{item.name}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ion-text-color-secondary)', margin: '0 12px' }}>x{qty}</span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ion-text-color)' }}>₱{basePrice.toFixed(2)}</span>
                      </div>
                      {item.selectedOptions?.map((opt, oi) => {
                        const optTotal = opt.choicePrice * qty;
                        return optTotal > 0 ? (
                          <p key={oi} style={{ margin: '2px 0 0 12px', fontSize: '12px', color: 'var(--ion-text-color-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{opt.choiceName}</span>
                            <span>₱{optTotal.toFixed(2)}</span>
                          </p>
                        ) : (
                          <p key={oi} style={{ margin: '2px 0 0 12px', fontSize: '12px', color: 'var(--ion-text-color-secondary)' }}>{opt.choiceName}</p>
                        );
                      })}
                      {item.selectedAddOns?.map((addon, ai) => {
                        const addonTotal = addon.price * qty;
                        return (
                          <p key={ai} style={{ margin: '2px 0 0 12px', fontSize: '12px', color: 'var(--ion-text-color-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>+ {addon.name}</span>
                            <span>₱{addonTotal.toFixed(2)}</span>
                          </p>
                        );
                      })}
                      <div style={{ borderTop: '1px dashed var(--ion-border-color)', marginTop: '6px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: 'var(--ion-text-color)' }}>
                        <span>Item subtotal</span>
                        <span>₱{(item.price * qty).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              {detailsOrder.items.some(item => item.specialInstructions) && (
                <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--ion-card-background)', borderRadius: '10px', border: '1px solid var(--ion-border-color)' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--ion-text-color-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Notes</p>
                  {detailsOrder.items.filter(i => i.specialInstructions).map((item, i) => (
                    <div key={i} style={{ marginBottom: i < detailsOrder.items.filter(i => i.specialInstructions).length - 1 ? '8px' : 0 }}>
                      <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: 'var(--ion-text-color)' }}>{item.name}</p>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--ion-text-color-secondary)', fontStyle: 'italic' }}>&quot;{item.specialInstructions}&quot;</p>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ padding: '12px', background: 'var(--ion-card-background)', borderRadius: '10px', marginBottom: '16px', border: '1px solid var(--ion-border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ion-text-color)' }}>Total</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ion-color-primary)' }}>₱{(detailsOrder.total - (detailsOrder.deliveryFee || 0)).toFixed(2)}</span>
              </div>

              {detailsOrder.cancelledReason && (
                <div style={{ padding: '10px 12px', background: '#FEE2E2', borderRadius: '8px', fontSize: '13px', color: '#DC2626' }}>
                  <strong style={{ display: 'block', marginBottom: '2px' }}>Cancellation Reason:</strong>
                  {detailsOrder.cancelledReason}
                </div>
              )}
            </div>
          )}
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showToast}
        message={toastMessage}
        duration={3000}
        onDidDismiss={() => setShowToast(false)}
        position="bottom"
        color="danger"
      />
    </>
  );
};

export default VendorDashboard;
