import React, { useState } from 'react';
import { IonCard, IonCardContent, IonBadge, IonButton } from '@ionic/react';
import AdminPageShell from '../../components/admin/AdminPageShell';
import FilterPills from '../../components/FilterPills';

interface OrderRow {
  id: string;
  stallName: string;
  customerName: string;
  status: string;
  total: number;
  riderName?: string;
  createdAt: string;
  cancelledAt?: string;
}

const AdminOrders: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const statusList = ['pending', 'preparing', 'delivering', 'delivered', 'cancelled'];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.stallName.toLowerCase().includes(searchQuery.toLowerCase()) || order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || order.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && order.status === filterStatus;
  });

  const cancelOrder = (id: string) => {
    if (window.confirm('Cancel this order?')) setOrders(orders.map(o => o.id === id ? { ...o, status: 'cancelled', cancelledAt: new Date().toLocaleString() } : o));
  };

  const getStatusColor = (s: string) => {
    const colors: Record<string, string> = { pending: '#F59E0B', preparing: '#7C3AED', delivering: 'var(--ion-color-primary)', delivered: '#10B981', cancelled: '#EF4444' };
    return colors[s] || '#9CA3AF';
  };

  return (
    <AdminPageShell
      title="Manage Orders"
      search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search by stall, customer, or order ID...' }}
    >
      <div className="mb-4">
        <FilterPills
          layoutId="admin-orders-status"
          even
          value={filterStatus}
          onChange={setFilterStatus}
          items={[{ id: 'all', label: 'All' }, ...statusList.map(s => ({ id: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))]}
        />
      </div>

      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <IonCard style={{ margin: 0, background: 'var(--ion-card-background)' }}>
            <IonCardContent style={{ padding: '16px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--ion-text-color-secondary)' }}>Total Orders</p>
              <h3 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: 'var(--ion-text-color)' }}>{orders.length}</h3>
            </IonCardContent>
          </IonCard>
          <IonCard style={{ margin: 0, background: 'var(--ion-card-background)' }}>
            <IonCardContent style={{ padding: '16px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--ion-text-color-secondary)' }}>Revenue</p>
              <h3 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#10B981' }}>₱{orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0).toLocaleString()}</h3>
            </IonCardContent>
          </IonCard>
        </div>

        {filteredOrders.length === 0 ? (
          <IonCard style={{ margin: 0, background: 'var(--ion-card-background)', textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: 'var(--ion-text-color-secondary)' }}>No orders found</p>
          </IonCard>
        ) : (
          filteredOrders.map(order => (
            <IonCard key={order.id} style={{ margin: '0 0 16px', background: 'var(--ion-card-background)' }}>
              <IonCardContent style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: 'var(--ion-text-color)' }}>{order.stallName}</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--ion-text-color-secondary)' }}>by {order.customerName}</p>
                  </div>
                  <IonBadge style={{ '--background': getStatusColor(order.status), color: 'white' }}>{order.status}</IonBadge>
                </div>

                <div style={{ padding: '12px', background: 'var(--ion-background-color)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--ion-text-color-secondary)' }}>Order ID:</span>
                    <span style={{ color: 'var(--ion-text-color)', fontWeight: 600 }}>#{order.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--ion-text-color-secondary)' }}>Rider:</span>
                    <span style={{ color: 'var(--ion-text-color)', fontWeight: 600 }}>{order.riderName || 'Not assigned'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--ion-text-color-secondary)' }}>Total:</span>
                    <span style={{ color: 'var(--ion-text-color)', fontWeight: 600 }}>₱{order.total.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ion-text-color-secondary)' }}>Created:</span>
                    <span style={{ color: 'var(--ion-text-color)', fontWeight: 600 }}>{order.createdAt}</span>
                  </div>
                </div>

                {(order.status === 'pending' || order.status === 'preparing') && (
                  <IonButton fill="outline" size="small" style={{ '--border-color': '#EF4444', '--color': '#EF4444' }} onClick={() => cancelOrder(order.id)}>
                    Cancel Order
                  </IonButton>
                )}
              </IonCardContent>
            </IonCard>
          ))
        )}
      </div>
    </AdminPageShell>
  );
};

export default AdminOrders;
