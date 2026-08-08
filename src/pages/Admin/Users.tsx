import React, { useState, useEffect } from 'react';
import { IonCard, IonCardContent, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem } from '@ionic/react';
import { searchOutline, closeOutline, checkmarkCircle, closeCircle, personOutline, bicycleOutline, storefrontOutline, shieldCheckmarkOutline, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import AdminPageShell from '../../components/admin/AdminPageShell';
import PageLoader from '../../components/PageLoader';
import { fetchAllUsers, getRoleProfile, setRoleStatus, updateUserRole, updateUserDocument, removeUserRole } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

const roleIcon: Record<string, typeof personOutline> = {
  customer: personOutline,
  rider: bicycleOutline,
  vendor: storefrontOutline,
  admin: shieldCheckmarkOutline,
};

const roleColor: Record<string, string> = {
  customer: '#8B5CF6',
  rider: '#F59E0B',
  vendor: '#10B981',
  admin: '#EF4444',
};

const statusBadge: Record<string, { label: string; color: string }> = {
  approved: { label: 'Approved', color: '#10B981' },
  pending: { label: 'Pending', color: '#F59E0B' },
  rejected: { label: 'Rejected', color: '#EF4444' },
};

const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const all = await fetchAllUsers();
        setUsers(all);
      } catch { /* users load is best-effort */ }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    if (roleFilter === 'all') return matchesSearch;
    return matchesSearch && u.roles?.includes(roleFilter as User['role']);
  });

  const handleApprove = async (uid: string, role: string) => {
    await setRoleStatus(uid, role, 'approved');
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, roleStatus: { ...u.roleStatus, [role]: 'approved' } } : u));
    if (selectedUser?.id === uid) {
      setSelectedUser(prev => prev ? { ...prev, roleStatus: { ...prev.roleStatus, [role]: 'approved' } } : null);
    }
  };

  const handleReject = async (uid: string, role: string) => {
    await setRoleStatus(uid, role, 'rejected');
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, roleStatus: { ...u.roleStatus, [role]: 'rejected' } } : u));
    if (selectedUser?.id === uid) {
      setSelectedUser(prev => prev ? { ...prev, roleStatus: { ...prev.roleStatus, [role]: 'rejected' } } : null);
    }
  };

  const handleAddAdmin = async (uid: string) => {
    await updateUserRole(uid, 'admin');
    await updateUserDocument(uid, { isMasterAdmin: false });
    const fresh = await fetchAllUsers();
    setUsers(fresh);
    if (selectedUser?.id === uid) {
      const updated = fresh.find(u => u.id === uid);
      if (updated) setSelectedUser(updated);
    }
  };

  const handleRemoveAdmin = async (uid: string) => {
    await removeUserRole(uid, 'admin');
    const fresh = await fetchAllUsers();
    setUsers(fresh);
    if (selectedUser?.id === uid) {
      const updated = fresh.find(u => u.id === uid);
      if (updated) setSelectedUser(updated);
    }
  };

  return (
    <>
      <AdminPageShell title="Users" subtitle="Manage all users, riders, vendors"
        loading={loading}
        skeleton={<PageLoader message="Loading users..." />}
      >
        <div>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <IonIcon icon={searchOutline} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ion-text-color-secondary)', fontSize: '16px', zIndex: 1 }} />
            <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden" style={{ '--padding-start': '36px', '--min-height': '44px', '--highlight-height': '0', '--background': 'var(--ion-card-background)' } as React.CSSProperties}>
              <IonInput type="text" placeholder="Search users..." value={search} onIonInput={e => setSearch(e.detail.value!)} className="text-sm" style={{ '--padding-start': '0', '--padding-end': '12px' } as React.CSSProperties} />
            </IonItem>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['all', 'customer', 'vendor', 'rider', 'admin'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', background: roleFilter === r ? 'var(--ion-color-primary)' : 'var(--ion-card-background)', color: roleFilter === r ? 'white' : 'var(--ion-text-color-secondary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                {r === 'all' ? 'All' : r}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ion-text-color-secondary)', fontSize: '14px' }}>No users found</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filtered.map(u => (
                <IonCard key={u.id} className="cursor-pointer hover:shadow-lg transition-shadow duration-200" style={{ margin: 0, background: 'var(--ion-card-background)' }} onClick={() => setSelectedUser(u)}>
                  <IonCardContent style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--ion-text-color)' }}>{u.name || 'Unnamed'}</p>
                        <p style={{ margin: '2px 0 4px', fontSize: '12px', color: 'var(--ion-text-color-secondary)' }}>{u.email}</p>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(u.roles || []).map(r => {
                            if (r === 'customer') {
                              const verified = u.emailVerified;
                              return (
                                <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600, background: `${roleColor[r]}20`, color: roleColor[r] }}>
                                  <IonIcon icon={roleIcon[r]} style={{ fontSize: '11px' }} />
                                  Customer
                                  <span style={{ marginLeft: 2, color: verified ? '#10B981' : '#F59E0B' }}>({verified ? 'Verified' : 'Unverified'})</span>
                                </span>
                              );
                            }
                            if (r === 'admin' && u.isMasterAdmin) {
                              return (
                                <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600, background: `${roleColor[r]}20`, color: roleColor[r] }}>
                                  <IonIcon icon={roleIcon[r]} style={{ fontSize: '11px' }} />
                                  Master Admin
                                </span>
                              );
                            }
                            const st = u.roleStatus?.[r];
                            const badge = statusBadge[st || 'pending'];
                            const label = r === 'admin' ? 'Admin' : r;
                            return (
                              <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600, background: `${roleColor[r] || '#999'}20`, color: roleColor[r] || '#999', textTransform: 'capitalize' }}>
                                <IonIcon icon={roleIcon[r] || personOutline} style={{ fontSize: '11px' }} />
                                {label}
                                {badge && <span style={{ marginLeft: 2, color: badge.color }}>({badge.label})</span>}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <IonIcon icon={closeOutline} style={{ fontSize: '16px', color: 'var(--ion-text-color-secondary)', transform: 'rotate(45deg)' }} />
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          )}
        </div>
      </AdminPageShell>

      <IonModal isOpen={!!selectedUser} onDidDismiss={() => setSelectedUser(null)}>
        <IonHeader>
          <IonToolbar style={{ '--background': 'var(--ion-card-background)' } as React.CSSProperties}>
            <IonButton slot="start" fill="clear" onClick={() => setSelectedUser(null)}><IonIcon icon={closeOutline} /></IonButton>
            <IonTitle>User Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'var(--ion-background-color)' } as React.CSSProperties}>
          {selectedUser && (
            <div style={{ padding: '16px' }}>
              <IonCard style={{ margin: '0 0 16px', background: 'var(--ion-card-background)' }}>
                <IonCardContent style={{ padding: '16px' }}>
                  <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--ion-text-color)' }}>{selectedUser.name || 'Unnamed'}</h2>
                  <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--ion-text-color-secondary)' }}>{selectedUser.email}</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: selectedUser.emailVerified ? '#10B98120' : '#F59E0B20', color: selectedUser.emailVerified ? '#10B981' : '#F59E0B', marginBottom: '16px' }}>
                    <IonIcon icon={selectedUser.emailVerified ? checkmarkCircleOutline : closeCircleOutline} style={{ fontSize: '12px' }} />
                    {selectedUser.emailVerified ? 'Verified' : 'Unverified'}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedUser.phone && <span style={{ padding: '4px 10px', background: 'var(--ion-background-color)', borderRadius: '6px', fontSize: '12px', color: 'var(--ion-text-color)' }}>📞 {selectedUser.phone}</span>}
                    {selectedUser.age ? <span style={{ padding: '4px 10px', background: 'var(--ion-background-color)', borderRadius: '6px', fontSize: '12px', color: 'var(--ion-text-color)' }}>Age: {selectedUser.age}</span> : null}
                    {selectedUser.address && <span style={{ width: '100%', padding: '4px 10px', background: 'var(--ion-background-color)', borderRadius: '6px', fontSize: '12px', color: 'var(--ion-text-color)' }}>📍 {selectedUser.address}</span>}
                  </div>
                </IonCardContent>
              </IonCard>

              <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: 'var(--ion-text-color)' }}>Roles & Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
                {(selectedUser.roles || []).map(r => {
                  if (r === 'customer') {
                    const verified = selectedUser.emailVerified;
                    return (
                      <div key={r} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--ion-card-background)', borderRadius: '8px', border: '1px solid var(--ion-border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <IonIcon icon={roleIcon[r]} style={{ fontSize: '18px', color: roleColor[r] }} />
                          <div>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--ion-text-color)', textTransform: 'capitalize' }}>Customer</p>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: verified ? '#10B981' : '#F59E0B' }}>{verified ? 'Verified' : 'Unverified'}</span>
                          </div>
                        </div>
                        {verified && <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>✓ Active</span>}
                      </div>
                    );
                  }
                  if (r === 'admin' && selectedUser.isMasterAdmin) {
                    return (
                      <div key={r} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--ion-card-background)', borderRadius: '8px', border: '1px solid var(--ion-border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <IonIcon icon={roleIcon[r]} style={{ fontSize: '18px', color: roleColor[r] }} />
                          <div>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--ion-text-color)' }}>Master Admin</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  const st = selectedUser.roleStatus?.[r] || 'none';
                  const isPending = st === 'pending';
                  const isRejected = st === 'rejected';
                  const isNone = st === 'none';
                  const label = r === 'admin' ? 'Admin' : r;
                  return (
                    <div key={r} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--ion-card-background)', borderRadius: '8px', border: '1px solid var(--ion-border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IonIcon icon={roleIcon[r] || personOutline} style={{ fontSize: '18px', color: roleColor[r] || '#999' }} />
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--ion-text-color)', textTransform: 'capitalize' }}>{label}</p>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: statusBadge[st]?.color || '#999' }}>{statusBadge[st]?.label || st}</span>
                        </div>
                      </div>
                      {(r === 'vendor' || r === 'rider') && (isPending || isRejected) && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleApprove(selectedUser.id, r)}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#10B981', color: 'white', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                            <IonIcon icon={checkmarkCircle} style={{ marginRight: 4 }} />Approve
                          </button>
                          <button onClick={() => handleReject(selectedUser.id, r)}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#EF4444', color: 'white', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                            <IonIcon icon={closeCircle} style={{ marginRight: 4 }} />Reject
                          </button>
                        </div>
                      )}
                      {!isPending && !isRejected && !isNone && (
                        <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>✓ Approved</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {currentUser?.isMasterAdmin && !selectedUser.roles.includes('admin') && (
                <div style={{ marginBottom: '16px' }}>
                  <IonButton expand="block" shape="round" color="danger" onClick={() => handleAddAdmin(selectedUser.id)}>
                    <IonIcon icon={shieldCheckmarkOutline} style={{ marginRight: 8 }} />
                    Add as Admin
                  </IonButton>
                </div>
              )}

              {selectedUser.roles.includes('admin') && !selectedUser.isMasterAdmin && selectedUser.id !== currentUser?.id && (
                <div style={{ marginBottom: '16px' }}>
                  <IonButton expand="block" shape="round" color="medium" onClick={() => handleRemoveAdmin(selectedUser.id)}>
                    <IonIcon icon={shieldCheckmarkOutline} style={{ marginRight: 8 }} />
                    Remove Admin
                  </IonButton>
                </div>
              )}

              <UserRoleTabs user={selectedUser} />

              <IonButton expand="block" fill="outline" onClick={() => setSelectedUser(null)} style={{ '--border-color': 'var(--ion-border-color)', '--color': 'var(--ion-text-color-secondary)' } as React.CSSProperties}>
                Close
              </IonButton>
            </div>
          )}
        </IonContent>
      </IonModal>
    </>
  );
};

const SECTION_LABELS: Record<string, string> = {
  applicationType: 'Application Type',
  displayName: 'Store / Display Name',
  fullName: 'Full Name',
  contactEmail: 'Contact Email',
  contactPhone: 'Contact Phone',
  address: 'Address',
  description: 'Description',
  category: 'Category',
  vehicleType: 'Vehicle Type',
  governmentIdType: 'Government ID Type',
  governmentIdNumber: 'Government ID Number',
  governmentIdImageUrl: 'Government ID Image',
  driverLicenseNumber: 'Driver License Number',
  driverLicenseImageUrl: 'Driver License Image',
  businessName: 'Registered Business Name',
  businessRegistrationNumber: 'Business Registration Number',
  businessDocumentType: 'Business Document Type',
  businessDocumentImageUrl: 'Business Document Image',
  representativeName: 'Representative Name',
  representativeIdType: 'Representative ID Type',
  representativeIdNumber: 'Representative ID Number',
  representativeIdImageUrl: 'Representative ID Image',
  taxIdNumber: 'Tax ID Number (TIN)',
  companyName: 'Company Name',
  companyRegistrationNumber: 'Company Registration Number',
  companyDocumentImageUrl: 'Company Document Image',
  assignedRiderName: 'Assigned Rider Name',
  assignedRiderLicenseNumber: 'Assigned Rider License Number',
  assignedRiderLicenseImageUrl: 'Assigned Rider License Image',
};

const isImageUrlField = (key: string) =>
  /image(?:Url)?$/i.test(key) && typeof key === 'string';

const APPLICATION_INFO_FIELDS = ['displayName', 'fullName', 'contactEmail', 'contactPhone', 'address', 'description', 'category', 'vehicleType'];
const INDIVIDUAL_ID_FIELDS = ['governmentIdType', 'governmentIdNumber', 'governmentIdImageUrl', 'driverLicenseNumber', 'driverLicenseImageUrl'];
const BUSINESS_FIELDS = ['businessName', 'businessRegistrationNumber', 'businessDocumentType', 'businessDocumentImageUrl', 'representativeName', 'representativeIdType', 'representativeIdNumber', 'representativeIdImageUrl', 'taxIdNumber', 'companyName', 'companyRegistrationNumber', 'companyDocumentImageUrl', 'assignedRiderName', 'assignedRiderLicenseNumber', 'assignedRiderLicenseImageUrl'];

const ProfileSection: React.FC<{ title: string; fields: { label: string; value: string }[] }> = ({ title, fields }) => {
  const visible = fields.filter(f => f.value);
  if (visible.length === 0) return null;
  return (
    <div style={{ marginBottom: '16px' }}>
      <h4 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--ion-text-color-secondary)', textTransform: 'uppercase' }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {visible.map(f => (
          <div key={f.label}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ion-text-color-secondary)' }}>{f.label}</span>
            {isImageUrlField(f.label) ? (
              f.value.startsWith('http') ? (
                <img src={f.value} alt={f.label} className="w-full max-h-48 object-contain rounded mt-1" />
              ) : (
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--ion-text-color)' }}>{f.value}</p>
              )
            ) : (
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--ion-text-color)' }}>{f.value}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const renderProfileContent = (profile: Record<string, unknown> | null) => {
  if (!profile) return <p style={{ margin: 0, fontSize: '13px', color: 'var(--ion-text-color-secondary)' }}>No additional profile data</p>;

  const appType = profile.applicationType || 'individual';
  const sections: React.ReactNode[] = [];
  const commonFields: { label: string; value: string }[] = [];

  APPLICATION_INFO_FIELDS.forEach(key => {
    if (key === 'driverLicenseNumber' || key === 'driverLicenseImageUrl') return;
    const found = Object.keys(profile).find(k => k.toLowerCase() === key.toLowerCase());
    if (found && profile[found]) {
      commonFields.push({ label: SECTION_LABELS[found] || found, value: String(profile[found]) });
    }
  });

  sections.push(<ProfileSection key="info" title="Applicant Info" fields={commonFields} />);

  if (appType === 'individual') {
    const idFields: { label: string; value: string }[] = [];
    INDIVIDUAL_ID_FIELDS.forEach(key => {
      const found = Object.keys(profile).find(k => k.toLowerCase() === key.toLowerCase());
      if (found && profile[found]) {
        idFields.push({ label: SECTION_LABELS[found] || found, value: String(profile[found]) });
      }
    });
    sections.push(<ProfileSection key="id" title="ID Verification" fields={idFields} />);
  } else if (appType === 'business') {
    const bizFields: { label: string; value: string }[] = [];
    BUSINESS_FIELDS.forEach(key => {
      const found = Object.keys(profile).find(k => k.toLowerCase() === key.toLowerCase());
      if (found && profile[found]) {
        bizFields.push({ label: SECTION_LABELS[found] || found, value: String(profile[found]) });
      }
    });
    sections.push(<ProfileSection key="business" title="Business / Company Info" fields={bizFields} />);
  }

  const legacyFields = Object.entries(profile)
    .filter(([key]) => !['status', 'submittedAt', 'applicationType', ...APPLICATION_INFO_FIELDS, ...INDIVIDUAL_ID_FIELDS, ...BUSINESS_FIELDS].includes(key))
    .filter(([key]) => key !== 'status' && key !== 'submittedAt' && key !== 'applicationType')
    .map(([key, val]) => ({ label: SECTION_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' '), value: String(val) }));

  if (legacyFields.length > 0) {
    sections.push(<ProfileSection key="legacy" title="Additional Info" fields={legacyFields} />);
  }

  return <>{sections}</>;
};

const UserRoleTabs: React.FC<{ user: User }> = ({ user }) => {
  const [tab, setTab] = useState('');
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  const roleTabs = (user.roles || []).filter(r => r !== 'admin' && r !== 'customer');

  useEffect(() => {
    if (!tab && roleTabs.length > 0) setTab(roleTabs[0]);
  }, [user]);

  useEffect(() => {
    if (!tab) { setProfile(null); return; }
    (async () => {
      const data = await getRoleProfile(user.id, tab);
      setProfile(data);
    })();
  }, [tab, user.id]);

  const allTabs = ['customer', ...roleTabs];

  if (allTabs.length === 0) return null;

  return (
    <div style={{ marginBottom: '16px' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: 'var(--ion-text-color)' }}>Role Details</h3>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto' }}>
        {allTabs.map(r => (
          <button key={r} onClick={() => setTab(r)}
            style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', background: tab === r ? 'var(--ion-color-primary)' : 'var(--ion-card-background)', color: tab === r ? 'white' : 'var(--ion-text-color-secondary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
            {r === 'customer' ? 'Customer Info' : `${r.charAt(0).toUpperCase() + r.slice(1)} Info`}
          </button>
        ))}
      </div>
      <IonCard style={{ margin: 0, background: 'var(--ion-card-background)' }}>
        <IonCardContent style={{ padding: '14px' }}>
          {tab === 'customer' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ion-text-color-secondary)' }}>Name</span><p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--ion-text-color)' }}>{user.name || '-'}</p></div>
              <div><span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ion-text-color-secondary)' }}>Email</span><p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--ion-text-color)' }}>{user.email || '-'}</p></div>
              <div><span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ion-text-color-secondary)' }}>Phone</span><p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--ion-text-color)' }}>{user.phone || '-'}</p></div>
              <div><span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ion-text-color-secondary)' }}>Age</span><p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--ion-text-color)' }}>{user.age || '-'}</p></div>
              <div><span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ion-text-color-secondary)' }}>Address</span><p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--ion-text-color)' }}>{user.address || '-'}</p></div>
            </div>
          ) : (
            renderProfileContent(profile)
          )}
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default AdminUsers;
