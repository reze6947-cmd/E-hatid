import React, { useState, useEffect } from 'react';
import { IonCard, IonCardContent, IonIcon, IonButton } from '@ionic/react';
import { peopleOutline, bicycleOutline, cartOutline, trendingUpOutline, warningOutline, checkmarkCircle, closeCircle, shieldCheckmarkOutline, imageOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import AdminPageShell from '../../components/admin/AdminPageShell';
import AdminStatCard from '../../components/admin/AdminStatCard';
import PageLoader from '../../components/PageLoader';
import { fetchAllUsers, fetchPendingApprovals, setRoleStatus, migrateUserAvatar } from '../../services/userService';
import { fetchStalls, migrateStallImages, saveMigratedStall } from '../../services/stallService';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

const AdminDashboard: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const [realStats, setRealStats] = useState({ totalUsers: 0, totalRiders: 0, totalOrders: 0, totalRevenue: 0 });
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await fetchAllUsers();
        const pending = await fetchPendingApprovals();
        setRealStats({
          totalUsers: all.length,
          totalRiders: all.filter(u => u.roles?.includes('rider')).length,
          totalOrders: 0,
          totalRevenue: 0,
        });
        setPendingUsers(pending);
      } catch { /* stats load is best-effort */ }
      setLoading(false);
    };
    load();
  }, []);

  const handleApprove = async (uid: string, role: string) => {
    await setRoleStatus(uid, role, 'approved');
    setPendingUsers(prev => prev.filter(x => x.id !== uid));
  };

  const handleReject = async (uid: string, role: string) => {
    await setRoleStatus(uid, role, 'rejected');
    setPendingUsers(prev => prev.filter(x => x.id !== uid));
  };

  const handleMigrateImages = async () => {
    setMigrating(true);
    setMigrationResult(null);
    let stallsMigrated = 0;
    let stallImages = 0;
    let avatarsMigrated = 0;
    try {
      const stalls = await fetchStalls();
      for (const stall of stalls) {
        const { updated, migrated } = await migrateStallImages(stall);
        if (migrated > 0) {
          await saveMigratedStall(updated);
          stallsMigrated++;
          stallImages += migrated;
        }
      }
      const allUsers = await fetchAllUsers();
      for (const u of allUsers) {
        if (await migrateUserAvatar(u)) avatarsMigrated++;
      }
      setMigrationResult(`Done: ${stallsMigrated} stalls (${stallImages} images) and ${avatarsMigrated} avatars migrated.`);
    } catch (err) {
      console.error('Image migration failed:', err);
      setMigrationResult('Migration failed. Check the console for details.');
    } finally {
      setMigrating(false);
    }
  };

  const statCards = [
    { icon: peopleOutline, label: 'Total Users', value: String(realStats.totalUsers), gradient: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)' },
    { icon: bicycleOutline, label: 'Total Riders', value: String(realStats.totalRiders), gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)' },
    { icon: cartOutline, label: 'Total Orders', value: String(realStats.totalOrders), gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' },
    { icon: trendingUpOutline, label: 'Total Revenue', value: `₱${realStats.totalRevenue.toLocaleString()}`, gradient: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)' },
    { icon: warningOutline, label: 'Pending Reports', value: '0', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)', onClick: () => history.push('/admin/reports') },
  ];

  return (
    <AdminPageShell title="Admin Dashboard" subtitle="Welcome back, Administrator"
      loading={loading}
      skeleton={<PageLoader message="Loading admin dashboard..." />}
    >
        <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {statCards.map((card, i) => (
            <AdminStatCard key={i} {...card} />
          ))}
        </div>
      </div>

      {user?.isMasterAdmin && (
        <div>
          <IonCard style={{ margin: 0, background: 'var(--ion-card-background)', border: '1px solid #EF444440' }}>
            <IonCardContent style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EF444420', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: '20px', color: '#EF4444' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--ion-text-color)' }}>Master Admin Controls</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--ion-text-color-secondary)' }}>You can add new admins</p>
                </div>
              </div>
              <IonButton expand="block" shape="round" color="danger" onClick={() => history.push('/admin/users')}>
                <IonIcon icon={shieldCheckmarkOutline} style={{ marginRight: 8 }} />
                Manage Admins
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      )}

      <div style={{ marginTop: '16px' }}>
        <IonCard style={{ margin: 0, background: 'var(--ion-card-background)', border: '1px solid #3B82F630' }}>
          <IonCardContent style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#3B82F620', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IonIcon icon={imageOutline} style={{ fontSize: '20px', color: '#3B82F6' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--ion-text-color)' }}>Migrate Legacy Images</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--ion-text-color-secondary)' }}>Move old base64 photos on stalls and avatars to Firebase Storage.</p>
              </div>
            </div>
            <IonButton expand="block" shape="round" color="primary" disabled={migrating} onClick={handleMigrateImages}>
              <IonIcon icon={imageOutline} style={{ marginRight: 8 }} />
              {migrating ? 'Migrating…' : 'Run Migration'}
            </IonButton>
            {migrationResult && (
              <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'var(--ion-text-color-secondary)' }}>{migrationResult}</p>
            )}
          </IonCardContent>
        </IonCard>
      </div>

      {pendingUsers.length > 0 && (
        <div>
          <h3 className="mb-4" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ion-text-color)' }}>
            Pending Approvals ({pendingUsers.length})
          </h3>
          <IonCard style={{ margin: 0, background: 'var(--ion-card-background)' }}>
            <IonCardContent style={{ padding: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {pendingUsers.map(u => {
                  const pendingRoles = Object.entries(u.roleStatus || {}).filter(([, s]) => s === 'pending').map(([r]) => r);
                  return (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--ion-background-color)', borderRadius: '8px' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--ion-text-color)' }}>{u.name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--ion-text-color-secondary)' }}>
                          {u.email} — <strong>{pendingRoles.join(', ')}</strong>
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {pendingRoles.map(role => (
                          <React.Fragment key={role}>
                            <button onClick={() => handleApprove(u.id, role)}
                              style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#10B981', color: 'white', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                              <IonIcon icon={checkmarkCircle} style={{ marginRight: 4 }} />Approve
                            </button>
                            <button onClick={() => handleReject(u.id, role)}
                              style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#EF4444', color: 'white', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                              <IonIcon icon={closeCircle} style={{ marginRight: 4 }} />Reject
                            </button>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      )}

      <div className="px-4 pb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--ion-text-color)' }}>Quick Actions</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <button onClick={() => history.push('/admin/users')} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--ion-border-color)', background: 'var(--ion-card-background)', color: 'var(--ion-text-color)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Manage Users</button>
          <button onClick={() => history.push('/admin/orders')} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--ion-border-color)', background: 'var(--ion-card-background)', color: 'var(--ion-text-color)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>View Orders</button>
          <button onClick={() => history.push('/admin/reports')} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--ion-border-color)', background: 'var(--ion-card-background)', color: 'var(--ion-text-color)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>View Reports</button>
          <button onClick={() => history.push('/admin/users')} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--ion-border-color)', background: 'var(--ion-card-background)', color: 'var(--ion-text-color)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Manage Riders</button>
          <button onClick={() => history.push('/admin/delivery-config')} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--ion-border-color)', background: 'var(--ion-card-background)', color: 'var(--ion-text-color)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Delivery Config</button>
        </div>
      </div>
    </AdminPageShell>
  );
};

export default AdminDashboard;
