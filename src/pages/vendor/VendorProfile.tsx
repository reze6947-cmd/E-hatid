import React, { useState, useEffect, useRef } from 'react';
import { IonButton, IonIcon, IonSpinner, IonToast, IonInput, IonTextarea, IonToggle, IonItem } from '@ionic/react';
import { storefrontOutline, timeOutline, notificationsOutline, cameraOutline, personOutline, callOutline, locationOutline, logOutOutline, swapHorizontalOutline, checkmarkCircle, closeCircle, time, colorPaletteOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Marker } from 'react-leaflet';
import LeafletMap from '../../components/Map/LeafletMap';
import { profileMarkerIcon } from '../../components/Map/mapIcons';

import { useAuth } from '../../context/AuthContext';
import { getStallByVendorId, createStall, updateStall } from '../../services/stallService';
import { getRoleProfile } from '../../services/userService';
import { compressImage } from '../../utils/compressImage';

const VendorProfile: React.FC = () => {
  const history = useHistory();
  const { user, updateUserProfile, logout, roles, activeRole, setActiveRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stallId, setStallId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [stallAddress, setStallAddress] = useState('');
  const [stallName, setStallName] = useState('');
  const [description, setDescription] = useState('');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [active, setActive] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [coverPhoto, setCoverPhoto] = useState('');
  const [stallLogo, setStallLogo] = useState('');
  const [accentColor, setAccentColor] = useState('#6366F1');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [stallLatitude, setStallLatitude] = useState<number | null>(null);
  const [stallLongitude, setStallLongitude] = useState<number | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setVendorName(user.name || '');
    setVendorPhone(user.phone || '');
    setStallAddress(user.stallAddress || '');
    const loadData = async () => {
      try {
        const stall = await getStallByVendorId(user.id);
        if (stall) {
          setStallId(stall.id);
          setStallName(stall.name);
          setDescription(stall.description || '');
          setCoverPhoto(stall.image || '');
          setStallLogo(stall.logo || '');
          setAccentColor(stall.accentColor || '#6366F1');
          setActive(stall.active ?? true);
          if (stall.address) setStallAddress(stall.address);
          if (stall.latitude != null) setStallLatitude(stall.latitude);
          if (stall.longitude != null) setStallLongitude(stall.longitude);
          if (stall.deliveryTime) {
            const parts = stall.deliveryTime.split(' - ');
            if (parts.length === 2) { setOpenTime(parts[0]); setCloseTime(parts[1]); }
          }
        } else {
          const profile = await getRoleProfile(user.id, 'vendor');
          if (profile) {
            if (profile.businessName || profile.displayName) setStallName(profile.businessName || profile.displayName);
            if (profile.description) setDescription(profile.description);
            if (profile.address) setStallAddress(profile.address);
            if (profile.displayName) setVendorName(profile.displayName);
            if (profile.contactPhone) setVendorPhone(profile.contactPhone);
          } else {
            if (user.stallName) setStallName(user.stallName);
            if (user.stallAddress) setStallAddress(user.stallAddress);
          }
        }
      } catch (err) {
        console.error('Error loading stall or profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    const storedLocation = sessionStorage.getItem('vendorSelectedLocation');
    const locationName = sessionStorage.getItem('vendorLocationName');
    if (storedLocation && locationName) {
      try {
        const loc = JSON.parse(storedLocation);
        setStallAddress(locationName);
        setStallLatitude(loc.lat);
        setStallLongitude(loc.lng);
      } catch (e) {
        console.error('Error parsing stored location:', e);
      }
      sessionStorage.removeItem('vendorSelectedLocation');
      sessionStorage.removeItem('vendorLocationName');
    }
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile({
        name: vendorName,
        phone: vendorPhone,
        stallAddress,
      });
      const stallData = {
        id: user.id,
        name: stallName,
        description,
        image: coverPhoto || '/default-stall.jpg',
        rating: 0,
        deliveryTime: `${openTime} - ${closeTime}`,
        vendorId: user.id,
        category: 'Fast Food',
        logo: stallLogo || '',
        accentColor,
        active,
        address: stallAddress,
      };
      if (stallId) {
        await updateStall(stallId, stallData);
      } else {
        await createStall(stallData as any);
        setStallId(user.id);
      }
      setToastMessage('Settings saved successfully!');
      setShowToast(true);
    } catch (err) {
      console.error('Error saving stall:', err);
      setToastMessage('Failed to save settings');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingCover(true);
    try {
      const dataUrl = await compressImage(file, 800, 800, 400);
      setCoverPhoto(dataUrl);
    } catch (err) {
      console.error('Error uploading cover:', err);
      setToastMessage('Failed to upload cover photo');
      setShowToast(true);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingLogo(true);
    try {
      const dataUrl = await compressImage(file, 200, 200, 200);
      setStallLogo(dataUrl);
    } catch (err) {
      console.error('Error uploading logo:', err);
      setToastMessage('Failed to upload logo');
      setShowToast(true);
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <IonSpinner />
      </div>
    );
  }

  return (
    <>
      {/* Avatar */}
      <div className="text-center mb-6 pt-4">
        <div
          onClick={() => logoInputRef.current?.click()}
          className="w-[88px] h-[88px] rounded-full mx-auto mb-4 cursor-pointer relative overflow-hidden bg-[var(--ion-color-primary)] flex items-center justify-center"
        >
          {stallLogo ? (
            <img src={stallLogo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[36px] font-bold text-white">
              {stallName ? stallName.charAt(0).toUpperCase() : 'V'}
            </span>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-black/40 py-1 flex items-center justify-center">
            <IonIcon icon={cameraOutline} className="text-sm text-white" />
          </div>
        </div>
        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        <p className="text-[10px] text-[var(--ion-text-color-secondary)] opacity-60 -mt-2 mb-2">Recommended: 512×512px square — shown on home page &amp; stall header</p>
        <h1 className="text-2xl font-bold text-[var(--ion-text-color)] m-0 mb-1">{stallName || 'My Stall'}</h1>
        <p className="text-sm text-[var(--ion-text-color-secondary)] m-0">{vendorName}</p>
      </div>

      {/* Contact Information */}
      <div className="bg-[var(--ion-card-background)] rounded-xl p-4 mb-4 border border-[var(--ion-border-color)]">
        <h3 className="text-sm font-semibold text-[var(--ion-text-color)] mb-4 uppercase opacity-70">Contact Information</h3>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <IonIcon icon={personOutline} className="mr-2 text-[var(--ion-color-primary)]" />
            <span className="text-xs text-[var(--ion-text-color-secondary)]">Full Name</span>
          </div>
          <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
            <IonInput value={vendorName} onIonInput={e => setVendorName(e.detail.value!)} className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
          </IonItem>
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <IonIcon icon={callOutline} className="mr-2 text-[var(--ion-color-primary)]" />
            <span className="text-xs text-[var(--ion-text-color-secondary)]">Phone</span>
          </div>
          <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
            <IonInput type="tel" value={vendorPhone} onIonInput={e => setVendorPhone(e.detail.value!)} className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
          </IonItem>
        </div>

        <div>
          <div className="flex items-center mb-2">
            <IonIcon icon={locationOutline} className="mr-2 text-[var(--ion-color-primary)]" />
            <span className="text-xs text-[var(--ion-text-color-secondary)]">Stall Address</span>
          </div>
          <p className="w-full p-[10px] rounded-lg border border-[var(--ion-border-color)] bg-[var(--ion-background-color)] text-[var(--ion-text-color)] text-sm m-0">
            {stallAddress || 'No address set'}
          </p>
        </div>
      </div>

      {/* Stall Information */}
      <div className="bg-[var(--ion-card-background)] rounded-xl p-4 mb-4 border border-[var(--ion-border-color)]">
        <h3 className="text-sm font-semibold text-[var(--ion-text-color)] mb-4 uppercase opacity-70">
          <IonIcon icon={storefrontOutline} className="mr-1.5 align-middle" />
          Stall Information
        </h3>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span className="text-xs text-[var(--ion-text-color-secondary)]">Stall Name</span>
          </div>
          <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
            <IonInput value={stallName} onIonInput={e => setStallName(e.detail.value!)} className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
          </IonItem>
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span className="text-xs text-[var(--ion-text-color-secondary)]">Description</span>
          </div>
          <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
            <IonTextarea value={description} onIonInput={e => setDescription(e.detail.value!)} rows={3} className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--highlight-height': '0' } as any} />
          </IonItem>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center mb-2">
              <span className="text-xs text-[var(--ion-text-color-secondary)]">Open Time</span>
            </div>
            <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
              <IonInput type="time" value={openTime} onIonInput={e => setOpenTime(e.detail.value!)} className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
            </IonItem>
          </div>
          <div>
            <div className="flex items-center mb-2">
              <span className="text-xs text-[var(--ion-text-color-secondary)]">Close Time</span>
            </div>
            <IonItem className="ion-item-clean border border-[var(--ion-border-color)] rounded-lg overflow-hidden">
              <IonInput type="time" value={closeTime} onIonInput={e => setCloseTime(e.detail.value!)} className="text-sm" style={{ '--padding-start': '10px', '--padding-end': '10px', '--min-height': '40px', '--highlight-height': '0' } as any} />
            </IonItem>
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <IonIcon icon={storefrontOutline} className="text-base text-[var(--ion-color-primary)]" />
            <span className="text-sm font-medium text-[var(--ion-text-color)]">Show on Home Page</span>
          </div>
          <IonToggle checked={active} onIonChange={e => setActive(e.detail.checked)} style={{ '--background-checked': 'var(--ion-color-primary)' }} />
        </div>

        <div className="flex items-center justify-between py-2 border-t border-[var(--ion-border-color)] mt-2 pt-3">
          <div className="flex items-center gap-2">
            <IonIcon icon={notificationsOutline} className="text-base text-[var(--ion-color-primary)]" />
            <span className="text-sm font-medium text-[var(--ion-text-color)]">Push Notifications</span>
          </div>
          <IonToggle checked={notifications} onIonChange={e => setNotifications(e.detail.checked)} style={{ '--background-checked': 'var(--ion-color-primary)' }} />
        </div>
      </div>

      {/* Stall Appearance */}
      <div className="bg-[var(--ion-card-background)] rounded-xl p-4 mb-4 border border-[var(--ion-border-color)]">
        <h3 className="text-sm font-semibold text-[var(--ion-text-color)] mb-4 uppercase opacity-70">
          <IonIcon icon={colorPaletteOutline} className="mr-1.5 align-middle" />
          Stall Appearance
        </h3>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span className="text-xs text-[var(--ion-text-color-secondary)]">Cover Photo</span>
          </div>
          <p className="text-[10px] text-[var(--ion-text-color-secondary)] opacity-60 mb-2">Recommended: 1200×600px (2:1 ratio) — shown on home page &amp; menu</p>
          <div
            onClick={() => coverInputRef.current?.click()}
            className="w-full aspect-[2/1] rounded-lg border border-[var(--ion-border-color)] overflow-hidden cursor-pointer bg-[var(--ion-background-color)] flex items-center justify-center"
          >
            {uploadingCover ? (
              <IonSpinner name="crescent" />
            ) : coverPhoto ? (
              <img src={coverPhoto} alt="Cover" className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-[var(--ion-text-color-secondary)]">
                <IonIcon icon={cameraOutline} className="text-2xl" />
                <span className="text-xs">Tap to add cover photo</span>
              </div>
            )}
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
        </div>

        <div>
          <div className="flex items-center mb-2">
            <span className="text-xs text-[var(--ion-text-color-secondary)]">Accent Color</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border border-[var(--ion-border-color)] shrink-0" style={{ background: accentColor }} />
            <input type="text" value={accentColor} onChange={e => setAccentColor(e.target.value || '#6366F1')} placeholder="#6366F1"
              className="flex-1 p-[10px] rounded-lg border border-[var(--ion-border-color)] bg-[var(--ion-background-color)] text-[var(--ion-text-color)] text-sm"
            />
            <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-9 h-9 rounded-lg border-0 cursor-pointer p-0" />
          </div>
        </div>
      </div>

      {/* Stall Location */}
      <div className="bg-[var(--ion-card-background)] rounded-xl p-4 mb-4 border border-[var(--ion-border-color)]">
        <h3 className="text-sm font-semibold text-[var(--ion-text-color)] mb-4 uppercase opacity-70">
          <IonIcon icon={locationOutline} className="mr-1.5 align-middle" />
          Stall Location
        </h3>

        {stallLatitude != null && stallLongitude != null && (
          <p className="text-xs text-[var(--ion-color-primary)] mb-2">
            📍 {stallLatitude.toFixed(6)}, {stallLongitude.toFixed(6)}
          </p>
        )}
        <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-[var(--ion-border-color)] mb-3">
          <LeafletMap
            center={[stallLatitude || 14.5995, stallLongitude || 120.9842]}
            zoom={15}
            className="w-full h-full"
            dragging={false}
            scrollWheelZoom={false}
            touchZoom={false}
            doubleClickZoom={false}
          >
            {stallLatitude != null && stallLongitude != null && (
              <Marker position={[stallLatitude, stallLongitude]} icon={profileMarkerIcon} />
            )}
          </LeafletMap>
        </div>
        <IonButton expand="block" shape="round" className="h-12 text-base font-semibold" onClick={() => history.push('/vendor/location')}>
          Edit Location
        </IonButton>
      </div>

      {/* Save Button */}
      <IonButton expand="block" disabled={saving} shape="round" className="h-12 text-base font-semibold mb-3" onClick={handleSave}>
        {saving ? 'Saving...' : 'Save Changes'}
      </IonButton>

      {/* Switch Role */}
      {roles.length > 1 && (
        <div className="md:hidden bg-[var(--ion-card-background)] rounded-xl p-4 border border-[var(--ion-border-color)] mb-4">
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
        onClick={() => { logout(); history.push('/guest/home'); }}
      >
        <IonIcon icon={logOutOutline} slot="start" />
        Sign Out
      </IonButton>

      <IonToast isOpen={showToast} message={toastMessage} duration={3000} onDidDismiss={() => setShowToast(false)} position="bottom"
        color={toastMessage.includes('Failed') ? 'danger' : 'success'}
      />
    </>
  );
};

export default VendorProfile;
