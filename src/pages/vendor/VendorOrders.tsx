import React, { useState, useEffect } from 'react';
import {
  IonContent, IonCard, IonCardContent, IonButton, IonIcon, IonSpinner,
  IonModal, IonHeader, IonToolbar, IonButtons, IonTitle, IonTextarea, IonToast,
} from '@ionic/react';
import { checkmarkOutline, closeOutline, personOutline, callOutline, timeOutline, locationOutline, listOutline, carOutline, checkmarkCircle, closeCircle, alertCircleOutline, navigateOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useAuth } from '../../context/AuthContext';
import { updateOrderStatus, subscribeVendorOrders } from '../../services/orderService';
import { useOrders } from '../../context/OrderContext';
import { openGoogleMapsDirections } from '../../utils/geocode';
import { Order } from '../../types';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/PageLoader';

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

type FilterTab = 'all' | 'pending' | 'active' | 'completed' | 'cancelled';

const TIMEOUT_MS = 30 * 60 * 1000;

const VendorOrders: React.FC = () => {
  const history = useHistory();
  const { logout, user } = useAuth();
  const { updateOrderStatus: localUpdateStatus } = useOrders();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineOrderId, setDeclineOrderId] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeVendorOrders(user.id, (data) => {
      const now = Date.now();
      const updated = data.map(o => {
        if (o.status === 'pending' && now - new Date(o.createdAt).getTime() > TIMEOUT_MS) {
          updateOrderStatus(o.id, { status: 'cancelled', cancelledReason: 'Auto-cancelled (30 min timeout)' });
          return { ...o, status: 'cancelled' as const, cancelledReason: 'Auto-cancelled (30 min timeout)' };
        }
        return o;
      });
      setOrders(updated);
      setError(null);
      setLoading(false);
    }, (err) => {
      console.error('Failed to subscribe to vendor orders:', err);
      setError('Could not load your orders');
      setLoading(false);
    });
    return () => unsub();
  }, [user, retryKey]);

  const retryLoad = () => {
    setLoading(true);
    setError(null);
    setRetryKey(k => k + 1);
  };

  const handleAccept = async (order: Order) => {
    setProcessingOrders(prev => new Set(prev).add(order.id));
    try {
      await updateOrderStatus(order.id, { status: 'accepted' });
      localUpdateStatus(order.id, 'accepted');
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'accepted' } : o));
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
      setOrders(prev => prev.map(o => o.id === declineOrderId ? { ...o, status: 'cancelled', cancelledReason: reason } : o));
    } catch {
      setToastMessage('Failed to decline order');
      setShowToast(true);
    } finally {
      setProcessingOrders(prev => { const s = new Set(prev); s.delete(declineOrderId); return s; });
      setDeclineModalOpen(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'pending') return o.status === 'pending';
    if (filter === 'active') return ['accepted', 'preparing', 'ready', 'delivering'].includes(o.status);
    if (filter === 'completed') return o.status === 'delivered';
    if (filter === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  const isProcessing = (id: string) => processingOrders.has(id);

  if (loading) {
    return <PageLoader message="Loading your orders..." />;
  }

  const FILTER_PILLS: {
    tab: FilterTab;
    label: string;
    icon: string;
    accent: string;
    count: number;
  }[] = [
    { tab: 'all', label: 'All', icon: listOutline, accent: 'text-[var(--ion-text-color)]', count: orders.length },
    { tab: 'pending', label: 'Pending', icon: timeOutline, accent: 'text-[#F59E0B]', count: orders.filter(o => o.status === 'pending').length },
    { tab: 'active', label: 'Active', icon: carOutline, accent: 'text-[var(--ion-color-primary)]', count: orders.filter(o => ['accepted', 'preparing', 'ready', 'delivering'].includes(o.status)).length },
    { tab: 'completed', label: 'Completed', icon: checkmarkCircle, accent: 'text-[var(--ion-color-success)]', count: orders.filter(o => o.status === 'delivered').length },
    { tab: 'cancelled', label: 'Cancelled', icon: closeCircle, accent: 'text-[var(--ion-color-danger)]', count: orders.filter(o => o.status === 'cancelled').length },
  ];

  const formatTime = (iso: string | Date | any) => {
    if (!iso) return '';
    if (typeof iso?.toDate === 'function') iso = iso.toDate();
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>

        <div className="w-full flex-1 md:pt-8 pb-10 flex flex-col space-y-3 sm:space-y-4">
          <PageHeader title="Orders" subtitle="View and manage incoming orders" />

          <div className="flex flex-wrap gap-2 sm:gap-2.5 mb-5">
            {FILTER_PILLS.map(pill => {
              const active = filter === pill.tab;
              return (
                <motion.button
                  key={pill.tab}
                  type="button"
                  layout
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFilter(pill.tab)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 min-h-[44px] shadow-sm transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ion-color-primary)] focus-visible:ring-offset-2 ${
                    active
                      ? 'bg-[var(--ion-color-primary)] border-[var(--ion-color-primary)]'
                      : 'bg-[var(--ion-card-background)] border-[var(--ion-border-color)] hover:border-[var(--ion-color-primary)]/50'
                  }`}
                >
                  <IonIcon icon={pill.icon} className={`text-base shrink-0 ${active ? 'text-white' : pill.accent}`} />
                  <span className={`text-sm font-bold tabular-nums leading-none ${active ? 'text-white' : 'text-[var(--ion-text-color)]'}`}>{pill.count}</span>
                  <span className={`text-xs font-medium leading-none ${active ? 'text-white/80' : 'text-[var(--ion-text-color-secondary)]'}`}>{pill.label}</span>
                </motion.button>
              );
            })}
          </div>

          {error ? (
            <IonCard className="rounded-xl shadow">
              <IonCardContent>
                <div className="text-center py-8">
                  <IonIcon icon={alertCircleOutline} className="text-4xl text-[var(--ion-color-danger)] mb-3" />
                  <p className="text-sm font-semibold text-[var(--ion-text-color)] m-0 mb-1">Couldn't load your orders</p>
                  <p className="text-sm text-[var(--ion-text-color-secondary)] m-0 mb-4">Check your connection and try again</p>
                  <IonButton fill="outline" shape="round" onClick={retryLoad}>Retry</IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          ) : filteredOrders.length === 0 ? (
            <IonCard className="rounded-xl shadow"><IonCardContent><p className="text-center text-[var(--ion-text-color-secondary)] m-0">You don't have any orders yet</p></IonCardContent></IonCard>
          ) : (
            <div className="grid gap-4">
              {filteredOrders.map(order => (
                <IonCard key={order.id} className={`rounded-xl shadow ${order.status === 'cancelled' ? 'opacity-60' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setDetailsOrder(order)}>
                  <IonCardContent>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--ion-text-color)' }}>
                          #{order.id.slice(-5)}
                          <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--ion-text-color-secondary)', marginLeft: '8px' }}>
                            <IonIcon icon={timeOutline} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                            {formatTime(order.createdAt)}
                          </span>
                        </h3>
                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--ion-text-color-secondary)' }}>
                          {order.customerName || 'Unknown'}
                          {order.customerPhone && ` · ${order.customerPhone}`}
                        </p>
                      </div>
                      <span style={badgestyle(order.status)}>{STATUS_BADGE[order.status]?.label || order.status}</span>
                    </div>

                    <div style={{ padding: '12px', background: 'var(--ion-background-color)', borderRadius: '8px', marginBottom: '12px' }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', marginBottom: i < order.items.length - 1 ? '8px' : 0 }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'var(--ion-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{item.name.charAt(0)}</span>
                          </div>
                          <span style={{ color: 'var(--ion-text-color)', flex: 1 }}>{item.name}</span>
                          <span style={{ color: 'var(--ion-text-color-secondary)' }}>x{item.quantity}</span>
                        </div>
                      ))}
                      <div style={{ borderTop: '1px solid var(--ion-border-color)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, color: 'var(--ion-text-color)' }}>Total</span>
                        <span style={{ fontWeight: 700, color: 'var(--ion-color-primary)' }}>₱{(order.total - (order.deliveryFee || 0)).toFixed(2)}</span>
                      </div>
                    </div>

                    {order.cancelledReason && (
                      <div style={{ padding: '8px 12px', background: '#FEE2E2', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', color: '#DC2626' }}>
                        <strong>Reason:</strong> {order.cancelledReason}
                      </div>
                    )}

                    {order.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
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
                      <div style={{ display: 'flex', gap: '8px' }}>
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
                              setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'ready' } : o));
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
                  {detailsOrder.stallLatitude != null && detailsOrder.stallLongitude != null && detailsOrder.customerLatitude != null && detailsOrder.customerLongitude != null && (
                    <div style={{ marginTop: '12px' }}>
                      <IonButton
                        expand="block"
                        fill="outline"
                        style={{ '--border-color': 'var(--ion-color-primary)', '--color': 'var(--ion-color-primary)', '--border-radius': '12px' }}
                        className="h-11 text-sm font-semibold"
                        onClick={() => openGoogleMapsDirections(
                          detailsOrder.customerLatitude!,
                          detailsOrder.customerLongitude!,
                          detailsOrder.deliveryAddress,
                          detailsOrder.stallLatitude!,
                          detailsOrder.stallLongitude!
                        )}
                      >
                        <IonIcon icon={navigateOutline} slot="start" />
                        View Delivery Route
                      </IonButton>
                      <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--ion-text-color-secondary)', textAlign: 'center', lineHeight: '1.5' }}>
                        This opens Google Maps so you can view the delivery route to your customer.
                      </p>
                    </div>
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

export default VendorOrders;
