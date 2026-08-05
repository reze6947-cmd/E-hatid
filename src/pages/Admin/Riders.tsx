import React, { useState } from 'react';
import { IonCard, IonCardContent, IonIcon, IonBadge, IonButton, IonSegment, IonSegmentButton, IonLabel } from '@ionic/react';
import { bicycleOutline, trashOutline, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import AdminPageShell from '../../components/admin/AdminPageShell';

const AdminRiders: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [riders, setRiders] = useState<any[]>([]);

  const filteredRiders = riders.filter(rider => {
    const matchesSearch = rider.name.toLowerCase().includes(searchQuery.toLowerCase()) || rider.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && rider.status === filterStatus;
  });

  const toggleVerification = (id: string) => setRiders(riders.map(r => r.id === id ? { ...r, isVerified: !r.isVerified } : r));
  const deleteRider = (id: string) => { if (window.confirm('Delete this rider?')) setRiders(riders.filter(r => r.id !== id)); };
  const getStatusColor = (s: string) => s === 'online' ? '#10B981' : s === 'busy' ? '#F59E0B' : '#9CA3AF';

  return (
    <AdminPageShell
      title="Manage Riders"
      search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search riders by name or email...' }}
    >
      <div>
        <IonSegment value={filterStatus} onIonChange={e => setFilterStatus(e.detail.value as string)} className="mb-4">
          <IonSegmentButton value="all"><IonLabel>All</IonLabel></IonSegmentButton>
          <IonSegmentButton value="online"><IonLabel>Online</IonLabel></IonSegmentButton>
          <IonSegmentButton value="offline"><IonLabel>Offline</IonLabel></IonSegmentButton>
          <IonSegmentButton value="busy"><IonLabel>Busy</IonLabel></IonSegmentButton>
        </IonSegment>
      </div>

      <div>
        {filteredRiders.length === 0 ? (
          <IonCard style={{ margin: 0, background: 'var(--ion-card-background)', textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: 'var(--ion-text-color-secondary)' }}>No riders found</p>
          </IonCard>
        ) : (
          filteredRiders.map(rider => (
            <IonCard key={rider.id} className="mb-4" style={{ margin: 0, background: 'var(--ion-card-background)' }}>
              <IonCardContent style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: 'var(--ion-text-color)' }}>{rider.name}</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--ion-text-color-secondary)' }}>{rider.email}</p>
                  </div>
                  <IonBadge style={{ '--background': getStatusColor(rider.status), color: 'white' }}>{rider.status}</IonBadge>
                </div>

                <div style={{ padding: '12px', background: 'var(--ion-background-color)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  {[
                    ['Phone', rider.phone], ['Vehicle', rider.vehicle], ['Plate', rider.licensePlate],
                    ['Deliveries', rider.totalDeliveries], ['Rating', `${rider.rating} ⭐`],
                  ].map(([label, val], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i < 4 ? '6px' : 0 }}>
                      <span style={{ color: 'var(--ion-text-color-secondary)' }}>{label}:</span>
                      <span style={{ color: 'var(--ion-text-color)', fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <IonButton fill="outline" size="small"
                    style={{ '--border-color': rider.isVerified ? '#EF4444' : '#10B981', '--color': rider.isVerified ? '#EF4444' : '#10B981', flex: 1 }}
                    onClick={() => toggleVerification(rider.id)}>
                    <IonIcon slot="start" icon={rider.isVerified ? closeCircleOutline : checkmarkCircleOutline} />
                    {rider.isVerified ? 'Unverify' : 'Verify'}
                  </IonButton>
                  <IonButton fill="outline" size="small" style={{ '--border-color': '#EF4444', '--color': '#EF4444' }} onClick={() => deleteRider(rider.id)}>
                    <IonIcon icon={trashOutline} />
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          ))
        )}
      </div>
    </AdminPageShell>
  );
};

export default AdminRiders;
