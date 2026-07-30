import React, { useState, useRef, useEffect } from 'react';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonLabel,
} from '@ionic/react';
import { personOutline, mailOutline, callOutline, locationOutline, logOutOutline, cameraOutline, checkmarkCircleOutline, closeCircleOutline, swapHorizontalOutline, checkmarkCircle, time, closeCircle } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

function MapFixer() {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 100); }, [map]);
  return null;
}

const profileMarkerIcon = L.divIcon({
  className: '',
  html: '<div style="background:var(--ion-color-primary);width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const COUNTRY_CODES = [
  { code: '+63', label: 'PH +63' },
  { code: '+1', label: 'US +1' },
  { code: '+44', label: 'UK +44' },
  { code: '+65', label: 'SG +65' },
  { code: '+61', label: 'AU +61' },
  { code: '+81', label: 'JP +81' },
  { code: '+852', label: 'HK +852' },
];

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const PHONE_FORMATS: Record<string, number[]> = {
  '+63': [3, 3, 4],
  '+1':  [3, 3, 4],
  '+44': [4, 3, 4],
  '+65': [4, 4],
  '+61': [3, 3, 3],
  '+81': [2, 4, 4],
  '+852':[4, 4],
};

const formatPhone = (digits: string, code: string) => {
  const groups = PHONE_FORMATS[code] || [3, 3, 4];
  let result = '';
  let i = 0;
  for (const size of groups) {
    if (i >= digits.length) break;
    if (result) result += ' ';
    result += digits.slice(i, i + size);
    i += size;
  }
  if (i < digits.length) result += ' ' + digits.slice(i);
  return result;
};

const UserProfile: React.FC = () => {
  const { user, updateUserProfile, logout, roles, activeRole, setActiveRole, refreshUser } = useAuth();
  const history = useHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPhone = user?.phone || '+63';
  const currentCountryCode = COUNTRY_CODES.find(c => currentPhone.startsWith(c.code))?.code || '+63';
  const currentNumber = currentPhone.startsWith(currentCountryCode)
    ? currentPhone.slice(currentCountryCode.length).replace(/\s/g, '')
    : currentPhone.replace(/\s/g, '');

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [emailError, setEmailError] = useState(
    user?.email && !isValidEmail(user.email) ? 'Invalid email address' : ''
  );
  const [countryCode, setCountryCode] = useState(currentCountryCode);
  const [phoneNumber, setPhoneNumber] = useState(formatPhone(currentNumber, currentCountryCode));
  const [phoneError, setPhoneError] = useState(
    currentNumber && currentNumber.length < 7 ? 'Phone must be at least 7 digits' : currentNumber === '' ? 'Phone is required' : ''
  );
  const [address] = useState(user?.address || '');
  const [age, setAge] = useState(user?.age?.toString() || '');

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setAge(user?.age?.toString() || '');
    setEmailError(user?.email && !isValidEmail(user.email) ? 'Invalid email address' : '');
    const phone = user?.phone || '+63';
    const code = COUNTRY_CODES.find(c => phone.startsWith(c.code))?.code || '+63';
    const digits = phone.startsWith(code) ? phone.slice(code.length).replace(/\s/g, '') : phone.replace(/\s/g, '');
    setCountryCode(code);
    setPhoneNumber(formatPhone(digits, code));
    setPhoneError(
      digits && digits.length < 7 ? 'Phone must be at least 7 digits' : digits === '' ? 'Phone is required' : ''
    );
  }, [user]);

  useEffect(() => {
    refreshUser();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateUserProfile({ avatar: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateUserProfile({
      name,
      email,
      phone: `${countryCode}${phoneNumber.replace(/\s/g, '')}`,
      age: age ? Number(age) : undefined,
    });
    history.push('/customer/home');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex-1 md:pt-8">
      <div className="text-center mb-4 pt-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-[88px] h-[88px] rounded-full mx-auto mb-4 cursor-pointer relative overflow-hidden bg-[var(--ion-color-primary)] flex items-center justify-center"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <IonIcon icon={personOutline} className="text-[44px] text-white" />
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-black/40 py-1 flex items-center justify-center">
            <IonIcon icon={cameraOutline} className="text-sm text-white" />
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <h1 className="text-2xl font-bold text-[var(--ion-text-color)] m-0 mb-1">{name}</h1>
        <p className="text-sm text-[var(--ion-text-color-secondary)] m-0">Member since 2024</p>
      </div>

      <div className="bg-[var(--ion-card-background)] rounded-2xl p-4 sm:p-6 mb-4 border border-[var(--ion-border-color)]">
        <h3 className="text-sm font-semibold text-[var(--ion-text-color)] mb-4 uppercase opacity-70">Contact Information</h3>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <IonIcon icon={personOutline} className="mr-2 text-[var(--ion-color-primary)]" />
            <IonLabel className="text-xs text-[var(--ion-text-color-secondary)]">Full Name</IonLabel>
          </div>
          <IonItem className="rounded-xl overflow-hidden" style={{ '--background': 'var(--ion-card-background)', '--border-radius': '12px', '--min-height': '44px', '--inner-box-shadow': 'none', border: '1px solid var(--ion-border-color)' } as any}>
            <IonInput value={name} onIonChange={e => setName(e.detail.value!)} className="[--color:var(--ion-text-color)] text-sm" />
          </IonItem>
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <IonIcon icon={mailOutline} className="mr-2 text-[var(--ion-color-primary)]" />
            <IonLabel className="text-xs text-[var(--ion-text-color-secondary)]">Email</IonLabel>
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: user?.emailVerified ? '#10B98120' : '#F59E0B20', color: user?.emailVerified ? '#10B981' : '#F59E0B' }}>
              <IonIcon icon={user?.emailVerified ? checkmarkCircleOutline : closeCircleOutline} className="text-[11px]" />
              {user?.emailVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
          <IonItem className="rounded-xl overflow-hidden" style={{ '--background': 'var(--ion-card-background)', '--border-radius': '12px', '--min-height': '44px', '--inner-box-shadow': 'none', border: '1px solid var(--ion-border-color)' } as any}>
            <IonInput type="email" value={email} onIonChange={e => { setEmail(e.detail.value!); setEmailError(isValidEmail(e.detail.value!) ? '' : 'Invalid email address'); }} className="[--color:var(--ion-text-color)] text-sm" />
          </IonItem>
          {emailError && <span className="text-[var(--ion-color-danger)] text-xs mt-1 block">{emailError}</span>}
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <IonIcon icon={locationOutline} className="mr-2 text-[var(--ion-color-primary)]" />
            <IonLabel className="text-xs text-[var(--ion-text-color-secondary)]">Delivery Address</IonLabel>
          </div>
          <p className="w-full p-3 rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-background-color)] text-[var(--ion-text-color)] text-sm m-0">
            {user?.address || 'No address set'}
          </p>
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <IonIcon icon={locationOutline} className="mr-2 text-[var(--ion-color-primary)]" />
            <IonLabel className="text-xs text-[var(--ion-text-color-secondary)]">Delivery Location</IonLabel>
          </div>
          {user?.latitude != null && user?.longitude != null && (
            <p className="text-xs text-[var(--ion-color-primary)] mb-2">📍 {user.latitude.toFixed(6)}, {user.longitude.toFixed(6)}</p>
          )}
          <div className="w-full h-[200px] rounded-xl overflow-hidden border border-[var(--ion-border-color)]" style={{ position: 'relative', isolation: 'isolate' }}>
            <MapContainer center={[user?.latitude || 14.5995, user?.longitude || 120.9842]} zoom={15} style={{ width: '100%', height: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false} touchZoom={false} doubleClickZoom={false}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {user?.latitude != null && user?.longitude != null && <Marker position={[user.latitude, user.longitude]} icon={profileMarkerIcon} />}
              <MapFixer />
            </MapContainer>
          </div>
          <IonButton expand="block" shape="round" className="mt-3 font-semibold" onClick={() => history.push('/customer/location')}>
            Edit Address
          </IonButton>
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <IonLabel className="text-xs text-[var(--ion-text-color-secondary)]">Age</IonLabel>
          </div>
          <IonItem className="rounded-xl overflow-hidden" style={{ '--background': 'var(--ion-card-background)', '--border-radius': '12px', '--min-height': '44px', '--inner-box-shadow': 'none', border: '1px solid var(--ion-border-color)' } as any}>
            <IonInput type="number" placeholder="Your age" value={age} onIonChange={e => setAge(e.detail.value!)} className="[--color:var(--ion-text-color)] text-sm" />
          </IonItem>
        </div>

        <div>
          <div className="flex items-center mb-2">
            <IonIcon icon={callOutline} className="mr-2 text-[var(--ion-color-primary)]" />
            <IonLabel className="text-xs text-[var(--ion-text-color-secondary)]">Phone</IonLabel>
          </div>
          <div className="flex gap-2">
            <IonItem className="rounded-xl overflow-hidden shrink-0" style={{ '--background': 'var(--ion-card-background)', '--border-radius': '12px', '--min-height': '44px', '--inner-box-shadow': 'none', border: '1px solid var(--ion-border-color)', width: '130px' } as any}>
              <IonSelect value={countryCode} onIonChange={e => setCountryCode(e.detail.value)} interface="popover" className="[--color:var(--ion-text-color)] text-sm">
                {COUNTRY_CODES.map(c => (
                  <IonSelectOption key={c.code} value={c.code}>{c.label}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem className="rounded-xl overflow-hidden flex-1" style={{ '--background': 'var(--ion-card-background)', '--border-radius': '12px', '--min-height': '44px', '--inner-box-shadow': 'none', border: '1px solid var(--ion-border-color)' } as any}>
              <IonInput type="tel" placeholder="9123456789" value={phoneNumber} onIonChange={e => { const digits = e.detail.value!.replace(/\D/g, ''); setPhoneNumber(formatPhone(digits, countryCode)); setPhoneError(digits.length >= 7 ? '' : digits.length === 0 ? 'Phone is required' : 'Phone must be at least 7 digits'); }} className="[--color:var(--ion-text-color)] text-sm" />
            </IonItem>
          </div>
          {phoneError && <span className="text-[var(--ion-color-danger)] text-xs mt-1 block">{phoneError}</span>}
        </div>
      </div>

      <IonButton expand="block" shape="round" className="min-h-[48px] font-semibold mb-3" onClick={handleSave} disabled={!!emailError || !!phoneError || !name.trim() || !email.trim()}>
        Save Changes
      </IonButton>

      <div className="md:hidden w-full mb-4">
        {roles.length > 1 && (
          <div className="bg-[var(--ion-card-background)] rounded-2xl p-4 border border-[var(--ion-border-color)]">
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
                  <IonButton
                    key={role}
                    disabled={disabled}
                    fill="clear"
                    onClick={() => { setActiveRole(role); }}
                    className="w-full min-h-[48px]"
                    style={{ '--background': active ? 'var(--ion-color-primary)' : 'transparent', '--border-radius': '12px', '--padding-start': '16px', '--padding-end': '16px', '--box-shadow': 'none' } as any}
                  >
                    <span className="flex-1 text-left font-medium capitalize">{role}</span>
                    <div className="flex items-center gap-2">
                      {active && (
                        <span className="text-[10px] font-semibold text-white bg-[var(--ion-color-primary)] px-2 py-0.5 rounded-full">Active</span>
                      )}
                      <IonIcon icon={stIcon} style={{ fontSize: '14px', color: stColor }} />
                      <span className="text-xs capitalize text-[var(--ion-text-color-secondary)]">{st}</span>
                    </div>
                  </IonButton>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <IonButton expand="block" shape="round" color="danger" className="md:hidden min-h-[48px] font-semibold mb-6" onClick={() => { logout(); history.push('/guest/home'); }}>
        <IonIcon icon={logOutOutline} slot="start" />
        Sign Out
      </IonButton>
    </div>
  );
};

export default UserProfile;
