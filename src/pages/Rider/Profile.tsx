import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonToast,
  IonInput,
  IonItem,
  IonToggle,
} from '@ionic/react';
import {
  personOutline,
  callOutline,
  mailOutline,
  carOutline,
  starOutline,
  logOutOutline,
  swapHorizontalOutline,
  checkmarkCircle,
  time,
  closeCircle,
  bicycleOutline,
  locationOutline,
  cashOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { getRoleProfile, updateRoleProfile, updateUserDocument } from '../../services/userService';
import { subscribeRiderOrders } from '../../services/orderService';
import { SUFFIXES, PH_REGIONS, formatNationalPH, fromStoredPhone, toStoredPhone, splitFullName, joinName, joinAddress } from '../../utils/profile';
import type { Order } from '../../types';

const initialProfile = {
  name: '',
  email: '',
  phone: '',
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  vehicle: '',
  licensePlate: '',
  licenseNumber: '',
  rating: 0,
  totalDeliveries: 0,
  bankAccount: '',
  bankName: '',
  addressStreet: '',
  addressBarangay: '',
  addressCity: '',
  addressProvince: '',
  addressRegion: '',
  addressZip: '',
};

const RiderProfile: React.FC = () => {
  const history = useHistory();
  const { user, logout, roles, activeRole, setActiveRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [profile, setProfile] = useState(initialProfile);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeRiderOrders(user.id, orders => {
      const active = orders.find(o => o.status === 'accepted' || o.status === 'delivering');
      setActiveOrder(active || null);
    });
    return () => unsub();
  }, [user]);

  const getProgressPercent = (status: string): number => {
    switch (status) {
      case 'accepted': return 10;
      case 'preparing': return 15;
      case 'ready': return 30;
      case 'delivering': return 65;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const loadProfile = async () => {
      try {
        const profileData = await getRoleProfile(user.id, 'rider');
        const nameParts = splitFullName(profileData?.fullName || user.name);
        setProfile({
          name: user.name || profileData?.fullName || '',
          email: user.email || profileData?.contactEmail || '',
          phone: fromStoredPhone(user.phone || profileData?.contactPhone),
          firstName: user.firstName || nameParts.firstName,
          middleName: user.middleName || nameParts.middleName,
          lastName: user.lastName || nameParts.lastName,
          suffix: user.suffix || nameParts.suffix,
          vehicle: profileData?.vehicleType || user.vehicle || '',
          licensePlate: profileData?.licensePlate || user.licensePlate || '',
          licenseNumber: profileData?.driverLicenseNumber || user.licenseNumber || '',
          rating: profileData?.rating || 0,
          totalDeliveries: profileData?.totalDeliveries || 0,
          bankAccount: user.bankAccount || profileData?.bankAccount || '',
          bankName: user.bankName || profileData?.bankName || '',
          addressStreet: user.addressStreet || profileData?.addressStreet || '',
          addressBarangay: user.addressBarangay || profileData?.addressBarangay || '',
          addressCity: user.addressCity || profileData?.addressCity || '',
          addressProvince: user.addressProvince || profileData?.addressProvince || '',
          addressRegion: user.addressRegion || profileData?.addressRegion || '',
          addressZip: user.addressZip || profileData?.addressZip || '',
        });
      } catch (err) {
        console.error('Error loading rider profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const composedName = joinName({
        firstName: profile.firstName,
        middleName: profile.middleName,
        lastName: profile.lastName,
        suffix: profile.suffix,
      });
      const composedAddress = joinAddress({
        addressStreet: profile.addressStreet,
        addressBarangay: profile.addressBarangay,
        addressCity: profile.addressCity,
        addressProvince: profile.addressProvince,
        addressRegion: profile.addressRegion,
        addressZip: profile.addressZip,
      });
      const storedPhone = toStoredPhone(profile.phone);
      setProfile(prev => ({ ...prev, name: composedName }));
      await updateUserDocument(user.id, {
        name: composedName,
        firstName: profile.firstName,
        middleName: profile.middleName,
        lastName: profile.lastName,
        suffix: profile.suffix,
        phone: storedPhone,
        address: composedAddress,
        addressStreet: profile.addressStreet,
        addressBarangay: profile.addressBarangay,
        addressCity: profile.addressCity,
        addressProvince: profile.addressProvince,
        addressRegion: profile.addressRegion,
        addressZip: profile.addressZip,
        vehicle: profile.vehicle,
        licensePlate: profile.licensePlate,
        licenseNumber: profile.licenseNumber,
        bankAccount: profile.bankAccount,
        bankName: profile.bankName,
      } as any);
      await updateRoleProfile(user.id, 'rider', {
        fullName: composedName,
        firstName: profile.firstName,
        middleName: profile.middleName,
        lastName: profile.lastName,
        suffix: profile.suffix,
        contactEmail: profile.email,
        contactPhone: storedPhone,
        address: composedAddress,
        addressStreet: profile.addressStreet,
        addressBarangay: profile.addressBarangay,
        addressCity: profile.addressCity,
        addressProvince: profile.addressProvince,
        addressRegion: profile.addressRegion,
        addressZip: profile.addressZip,
        vehicleType: profile.vehicle,
        licensePlate: profile.licensePlate,
        driverLicenseNumber: profile.licenseNumber,
        bankAccount: profile.bankAccount,
        bankName: profile.bankName,
      });
      setToastMessage('Profile saved successfully');
      setShowToast(true);
    } catch (err) {
      console.error('Error saving rider profile:', err);
      setToastMessage('Failed to save profile');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  const verificationStatus = user?.roleStatus?.rider || 'pending';
  const verificationConfig = {
    approved: { icon: checkmarkCircle, color: '#10B981', label: 'Approved' },
    pending: { icon: time, color: '#F59E0B', label: 'Pending' },
    rejected: { icon: closeCircle, color: '#EF4444', label: 'Rejected' },
  };
  const vConfig = verificationConfig[verificationStatus as keyof typeof verificationConfig] || verificationConfig.pending;

  const totalRating = profile.rating || 0;
  const totalDeliveries = profile.totalDeliveries || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <IonSpinner />
      </div>
    );
  }

  return (
    <div className="w-full flex-1 md:pt-8 pb-10 flex flex-col space-y-3 sm:space-y-4">
      {/* Avatar */}
      <div className="text-center">
        <div className="w-[88px] h-[88px] rounded-full mx-auto mb-4 overflow-hidden bg-[var(--ion-color-primary)] flex items-center justify-center">
          <span className="text-[36px] font-bold text-white">
            {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--ion-text-color)] m-0 mb-1">{profile.name}</h1>
        <div className="flex items-center justify-center gap-1 mb-1">
          <IonIcon icon={starOutline} className="text-sm text-[#F59E0B]" />
          <span className="text-sm text-[var(--ion-text-color-secondary)]">{totalRating.toFixed(1)} &middot; {totalDeliveries} deliveries</span>
        </div>
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold" style={{ background: `${vConfig.color}20`, color: vConfig.color }}>
          <IonIcon icon={vConfig.icon} className="text-sm" />
          {vConfig.label}
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-[var(--ion-card-background)] rounded-xl p-4 border border-[var(--ion-border-color)]">
        <h3 className="text-sm font-semibold text-[var(--ion-text-color)] mb-4 uppercase opacity-70">Contact Information</h3>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <IonIcon icon={personOutline} className="mr-2 text-[var(--ion-color-primary)]" />
            <span className="text-xs text-[var(--ion-text-color-secondary)]">Name</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block mb-1 text-[11px] font-medium text-[var(--ion-text-color-secondary)]">First Name</label>
              <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
                <IonInput value={profile.firstName} onIonInput={e => handleInputChange('firstName', e.detail.value!)} className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
              </IonItem>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block mb-1 text-[11px] font-medium text-[var(--ion-text-color-secondary)]">Middle Name <span className="opacity-60">(optional)</span></label>
              <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
                <IonInput value={profile.middleName} onIonInput={e => handleInputChange('middleName', e.detail.value!)} className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
              </IonItem>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block mb-1 text-[11px] font-medium text-[var(--ion-text-color-secondary)]">Last Name</label>
              <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
                <IonInput value={profile.lastName} onIonInput={e => handleInputChange('lastName', e.detail.value!)} className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
              </IonItem>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block mb-1 text-[11px] font-medium text-[var(--ion-text-color-secondary)]">Suffix</label>
              <select
                value={profile.suffix}
                onChange={e => handleInputChange('suffix', e.target.value)}
                className="w-full h-[40px] px-2.5 rounded-lg border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] text-sm text-[var(--ion-text-color)] focus:outline-none"
              >
                {SUFFIXES.map(s => <option key={s} value={s}>{s || 'None'}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <IonIcon icon={mailOutline} className="mr-2 text-[var(--ion-color-primary)]" />
            <span className="text-xs text-[var(--ion-text-color-secondary)]">Email</span>
          </div>
          <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
            <IonInput type="email" value={profile.email} onIonInput={e => handleInputChange('email', e.detail.value!)} className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
          </IonItem>
        </div>

        <div>
          <div className="flex items-center mb-2">
            <IonIcon icon={callOutline} className="mr-2 text-[var(--ion-color-primary)]" />
            <span className="text-xs text-[var(--ion-text-color-secondary)]">Phone Number</span>
          </div>
          <div className="flex items-stretch">
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[var(--ion-border-color)] bg-[var(--ion-background-color)] text-sm font-semibold text-[var(--ion-text-color)]">+63</span>
            <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-r-lg overflow-hidden flex-1">
              <IonInput type="tel" value={profile.phone} onIonInput={e => handleInputChange('phone', formatNationalPH(e.detail.value!))} placeholder="917 123 4567" className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
            </IonItem>
          </div>
          <p className="m-0 mt-1 text-[11px] text-[var(--ion-text-color-secondary)]">Philippine mobile number, e.g. 0917 123 4567</p>
        </div>
      </div>

      {/* Address */}
      <div className="bg-[var(--ion-card-background)] rounded-xl p-4 border border-[var(--ion-border-color)]">
        <h3 className="text-sm font-semibold text-[var(--ion-text-color)] mb-4 uppercase opacity-70">
          <IonIcon icon={locationOutline} className="mr-1.5 align-middle" />
          Address
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block mb-1 text-[11px] font-medium text-[var(--ion-text-color-secondary)]">Street / Unit</label>
            <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
              <IonInput value={profile.addressStreet} onIonInput={e => handleInputChange('addressStreet', e.detail.value!)} placeholder="e.g. 123 Mabini St." className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
            </IonItem>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block mb-1 text-[11px] font-medium text-[var(--ion-text-color-secondary)]">Barangay</label>
            <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
              <IonInput value={profile.addressBarangay} onIonInput={e => handleInputChange('addressBarangay', e.detail.value!)} placeholder="e.g. Barangay San Jose" className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
            </IonItem>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block mb-1 text-[11px] font-medium text-[var(--ion-text-color-secondary)]">City / Municipality</label>
            <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
              <IonInput value={profile.addressCity} onIonInput={e => handleInputChange('addressCity', e.detail.value!)} placeholder="e.g. Quezon City" className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
            </IonItem>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block mb-1 text-[11px] font-medium text-[var(--ion-text-color-secondary)]">Province</label>
            <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
              <IonInput value={profile.addressProvince} onIonInput={e => handleInputChange('addressProvince', e.detail.value!)} placeholder="e.g. Metro Manila" className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
            </IonItem>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block mb-1 text-[11px] font-medium text-[var(--ion-text-color-secondary)]">Region</label>
            <select
              value={profile.addressRegion}
              onChange={e => handleInputChange('addressRegion', e.target.value)}
              className="w-full h-[40px] px-2.5 rounded-lg border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] text-sm text-[var(--ion-text-color)] focus:outline-none"
            >
              <option value="">Select region</option>
              {PH_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block mb-1 text-[11px] font-medium text-[var(--ion-text-color-secondary)]">ZIP Code</label>
            <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
              <IonInput type="tel" value={profile.addressZip} onIonInput={e => handleInputChange('addressZip', e.detail.value!.replace(/\D/g, '').slice(0, 4))} placeholder="e.g. 1100" className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
            </IonItem>
          </div>
        </div>
      </div>

      {/* Vehicle Information */}
      <div className="bg-[var(--ion-card-background)] rounded-xl p-4 border border-[var(--ion-border-color)]">
        <h3 className="text-sm font-semibold text-[var(--ion-text-color)] mb-4 uppercase opacity-70">
          <IonIcon icon={carOutline} className="mr-1.5 align-middle" />
          Vehicle Information
        </h3>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span className="text-xs text-[var(--ion-text-color-secondary)]">Vehicle Type</span>
          </div>
          <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
            <IonInput value={profile.vehicle} onIonInput={e => handleInputChange('vehicle', e.detail.value!)} className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
          </IonItem>
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span className="text-xs text-[var(--ion-text-color-secondary)]">License Plate</span>
          </div>
          <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
            <IonInput value={profile.licensePlate} onIonInput={e => handleInputChange('licensePlate', e.detail.value!)} className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
          </IonItem>
        </div>

        <div>
          <div className="flex items-center mb-2">
            <span className="text-xs text-[var(--ion-text-color-secondary)]">License Number</span>
          </div>
          <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
            <IonInput value={profile.licenseNumber} onIonInput={e => handleInputChange('licenseNumber', e.detail.value!)} className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
          </IonItem>
        </div>
      </div>

      {/* Banking Information */}
      <div className="bg-[var(--ion-card-background)] rounded-xl p-4 border border-[var(--ion-border-color)]">
        <h3 className="text-sm font-semibold text-[var(--ion-text-color)] mb-4 uppercase opacity-70">
          <IonIcon icon={cashOutline} className="mr-1.5 align-middle" />
          Banking Information
        </h3>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span className="text-xs text-[var(--ion-text-color-secondary)]">Bank Name</span>
          </div>
          <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
            <IonInput value={profile.bankName} onIonInput={e => handleInputChange('bankName', e.detail.value!)} className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
          </IonItem>
        </div>

        <div>
          <div className="flex items-center mb-2">
            <span className="text-xs text-[var(--ion-text-color-secondary)]">Account Number</span>
          </div>
          <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
            <IonInput value={profile.bankAccount} onIonInput={e => handleInputChange('bankAccount', e.detail.value!)} className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
          </IonItem>
        </div>
      </div>

      {/* Delivery Status */}
      <div className="bg-[var(--ion-card-background)] rounded-xl p-4 border border-[var(--ion-border-color)]">
        <h3 className="text-sm font-semibold text-[var(--ion-text-color)] mb-4 uppercase opacity-70">
          <IonIcon icon={bicycleOutline} className="mr-1.5 align-middle" />
          Delivery Status
        </h3>
        {activeOrder ? (
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-[var(--ion-text-color)]">
                Order #{activeOrder.id.slice(-6)}
              </span>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full capitalize"
                style={{
                  background: activeOrder.status === 'delivering' ? '#10B98120' : '#6D28D920',
                  color: activeOrder.status === 'delivering' ? '#10B981' : '#6D28D9',
                }}
              >
                {activeOrder.status}
              </span>
            </div>
            <div className="mb-3">
              <p className="m-0 mb-1.5 text-xs text-[var(--ion-text-color-secondary)]">Delivery Progress</p>
              <div className="w-full h-2.5 rounded-full overflow-hidden bg-[var(--ion-border-color)]">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#6D28D9] to-[#10B981]"
                  style={{ width: `${getProgressPercent(activeOrder.status)}%` }}
                />
              </div>
              <p className="m-0 mt-1 text-xs font-bold text-[var(--ion-color-primary)] text-right">
                {getProgressPercent(activeOrder.status)}% complete
              </p>
            </div>
            {activeOrder.estimatedDeliveryTime && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[var(--ion-background-color)] text-xs text-[var(--ion-text-color-secondary)]">
                <IonIcon icon={locationOutline} className="text-sm text-[var(--ion-color-primary)]" />
                <span>ETA: {activeOrder.estimatedDeliveryTime}</span>
              </div>
            )}
            {activeOrder.deliveryAddress && (
              <p className="m-0 mt-2 text-xs text-[var(--ion-text-color-secondary)]">
                Delivering to: {activeOrder.deliveryAddress}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <IonIcon icon={bicycleOutline} className="text-3xl mb-2" style={{ color: 'var(--ion-border-color)' }} />
            <p className="m-0 text-xs text-[var(--ion-text-color-secondary)]">No active delivery</p>
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="bg-[var(--ion-card-background)] rounded-xl p-4 border border-[var(--ion-border-color)]">
        <h3 className="text-sm font-semibold text-[var(--ion-text-color)] mb-4 uppercase opacity-70">Preferences</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--ion-text-color)]">Enable Notifications</span>
          <IonToggle checked={notificationsEnabled} onIonChange={e => setNotificationsEnabled(e.detail.checked)} style={{ '--background-checked': 'var(--ion-color-primary)' }} />
        </div>
      </div>

      {/* Save Button */}
      <IonButton expand="block" disabled={saving} shape="round" className="h-12 text-base font-semibold mb-3" onClick={handleSave}>
        {saving ? 'Saving...' : 'Save Changes'}
      </IonButton>

      {/* Switch Role */}
      {roles.length > 1 && (
        <div className="md:hidden bg-[var(--ion-card-background)] rounded-xl p-4 border border-[var(--ion-border-color)]">
          <div className="flex items-center gap-2 mb-2">
            <IonIcon icon={swapHorizontalOutline} className="text-[var(--ion-color-primary)] text-base" />
            <h3 className="text-sm font-semibold text-[var(--ion-text-color)] m-0 uppercase opacity-70">Switch Role</h3>
          </div>
          <div className="space-y-2">
            {roles.map(role => {
              const st = role === 'customer' ? (user?.emailVerified ? 'approved' : 'pending') : (user?.roleStatus?.[role] || 'pending');
              const disabled = st === 'pending' || st === 'rejected';
              const active = role === activeRole;
              const stIcon = st === 'approved' ? checkmarkCircle : st === 'rejected' ? closeCircle : time;
              const stColor = st === 'approved' ? '#10B981' : st === 'rejected' ? '#EF4444' : '#F59E0B';
              return (
                <button key={role} disabled={disabled} onClick={() => setActiveRole(role)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-lg transition-colors text-sm ${
                    active ? 'bg-[var(--ion-color-primary)]/10' : 'hover:bg-[var(--ion-border-color)]/30'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className="flex-1 text-left font-medium capitalize text-[var(--ion-text-color)]">{role}</span>
                  <div className="flex items-center gap-2">
                    {active && <span className="text-[10px] font-semibold text-white bg-[var(--ion-color-primary)] px-2 py-0.5 rounded-full">Active</span>}
                    <IonIcon icon={stIcon} style={{ fontSize: '14px', color: stColor }} />
                    <span className="text-xs capitalize text-[var(--ion-text-color-secondary)]">{st}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sign Out */}
      <IonButton expand="block" color="danger" shape="round" className="md:hidden h-12 text-base font-semibold mb-6"
        onClick={handleLogout}
      >
        <IonIcon icon={logOutOutline} slot="start" />
        Sign Out
      </IonButton>

      <IonToast isOpen={showToast} message={toastMessage} duration={3000} onDidDismiss={() => setShowToast(false)} position="bottom"
        color={toastMessage.includes('Failed') ? 'danger' : 'success'}
      />
    </div>
  );
};

export default RiderProfile;
