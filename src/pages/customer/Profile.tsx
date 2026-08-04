import React, { useState, useRef, useEffect } from 'react';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import { personOutline, mailOutline, callOutline, locationOutline, logOutOutline, cameraOutline, checkmarkCircleOutline, closeCircleOutline, swapHorizontalOutline, checkmarkCircle, time, closeCircle } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Marker } from 'react-leaflet';
import LeafletMap from '../../components/Map/LeafletMap';
import { profileMarkerIcon } from '../../components/Map/mapIcons';
import OpenInGoogleMapsButton from '../../components/ui/OpenInGoogleMapsButton';

import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

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
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const phoneInputRef = useRef<HTMLIonInputElement>(null);

  const ageFromBirthDate = (d: string) => {
    if (!d) return undefined;
    const b = new Date(d);
    if (isNaN(b.getTime())) return undefined;
    const now = new Date();
    let years = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) years--;
    return years;
  };

  const handlePhoneChange = async (e: CustomEvent) => {
    const raw = e.detail.value || '';
    const inputEl = await phoneInputRef.current?.getInputElement();
    const caret = inputEl?.selectionStart ?? raw.length;
    const digits = raw.replace(/\D/g, '');
    const formatted = formatPhone(digits, countryCode);
    setPhoneNumber(formatted);
    setPhoneError(digits.length >= 7 ? '' : digits.length === 0 ? 'Phone is required' : 'Phone must be at least 7 digits');
    const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length;
    requestAnimationFrame(() => {
      if (!inputEl) return;
      let newCaret = 0;
      let seen = 0;
      while (newCaret < formatted.length && seen < digitsBeforeCaret) {
        if (formatted[newCaret] !== ' ') seen++;
        newCaret++;
      }
      inputEl.setSelectionRange(newCaret, newCaret);
    });
  };

  const handleCountryCodeChange = (e: CustomEvent) => {
    const code = e.detail.value;
    setCountryCode(code);
    setPhoneNumber(formatPhone(phoneNumber.replace(/\D/g, ''), code));
  };

  const memberSince = (() => {
    const c = user?.created_at;
    if (!c) return '2024';
    try {
      const d = typeof (c as any)?.toDate === 'function' ? (c as any).toDate() : new Date(c as any);
      return isNaN(d.getTime()) ? '2024' : d.getFullYear().toString();
    } catch {
      return '2024';
    }
  })();

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setBirthDate(user?.birthDate || '');
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile({
        name,
        email,
        phone: `${countryCode}${phoneNumber.replace(/\s/g, '')}`,
        birthDate: birthDate || undefined,
        age: ageFromBirthDate(birthDate),
      });
      setToastMessage('Profile saved');
      setShowToast(true);
      setTimeout(() => history.push('/customer/home'), 800);
    } catch {
      setToastMessage('Failed to save changes');
      setShowToast(true);
      setSaving(false);
    }
  };

  return (
    <div className="w-full flex-1 md:pt-8 flex flex-col space-y-3 sm:space-y-4">
      <div className="text-center">
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
        <p className="text-sm text-[var(--ion-text-color-secondary)] m-0">Member since {memberSince}</p>
      </div>

      <div className="bg-[var(--ion-card-background)] rounded-2xl p-4 sm:p-6 border border-[var(--ion-border-color)]">
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
          <IonItem className="rounded-xl overflow-hidden opacity-70" style={{ '--background': 'var(--ion-card-background)', '--border-radius': '12px', '--min-height': '44px', '--inner-box-shadow': 'none', border: '1px solid var(--ion-border-color)' } as any}>
            <IonInput type="email" value={email} readonly className="[--color:var(--ion-text-color)] text-sm" />
          </IonItem>
          {emailError && <span className="text-[var(--ion-color-danger)] text-xs mt-1 block">{emailError}</span>}
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <IonLabel className="text-xs text-[var(--ion-text-color-secondary)]">Birth Date</IonLabel>
          </div>
          <IonItem className="rounded-xl overflow-hidden" style={{ '--background': 'var(--ion-card-background)', '--border-radius': '12px', '--min-height': '44px', '--inner-box-shadow': 'none', border: '1px solid var(--ion-border-color)' } as any}>
            <IonInput type="date" value={birthDate} onIonChange={e => setBirthDate(e.detail.value || '')} className="[--color:var(--ion-text-color)] text-sm" />
          </IonItem>
        </div>

        <div>
          <div className="flex items-center mb-2">
            <IonIcon icon={callOutline} className="mr-2 text-[var(--ion-color-primary)]" />
            <IonLabel className="text-xs text-[var(--ion-text-color-secondary)]">Phone</IonLabel>
          </div>
          <div className="flex gap-2">
            <IonItem className="rounded-xl overflow-hidden shrink-0" style={{ '--background': 'var(--ion-card-background)', '--border-radius': '12px', '--min-height': '44px', '--inner-box-shadow': 'none', border: '1px solid var(--ion-border-color)', width: '130px' } as any}>
              <IonSelect value={countryCode} onIonChange={handleCountryCodeChange} interface="popover" className="[--color:var(--ion-text-color)] text-sm">
                {COUNTRY_CODES.map(c => (
                  <IonSelectOption key={c.code} value={c.code}>{c.label}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem className="rounded-xl overflow-hidden flex-1" style={{ '--background': 'var(--ion-card-background)', '--border-radius': '12px', '--min-height': '44px', '--inner-box-shadow': 'none', border: '1px solid var(--ion-border-color)' } as any}>
              <IonInput
                ref={phoneInputRef}
                type="tel"
                inputmode="tel"
                placeholder="9123456789"
                value={phoneNumber}
                onIonChange={handlePhoneChange}
                className="[--color:var(--ion-text-color)] text-sm"
              />
            </IonItem>
          </div>
          {phoneError && <span className="text-[var(--ion-color-danger)] text-xs mt-1 block">{phoneError}</span>}
        </div>
      </div>

      {/* Delivery Location */}
      <div className="bg-[var(--ion-card-background)] rounded-2xl p-4 sm:p-6 border border-[var(--ion-border-color)]">
        <h3 className="text-sm font-semibold text-[var(--ion-text-color)] mb-4 uppercase opacity-70">
          <IonIcon icon={locationOutline} className="mr-1.5 align-middle" />
          Delivery Location
        </h3>

        <p className="w-full p-[10px] rounded-lg border border-[var(--ion-border-color)] bg-[var(--ion-background-color)] text-[var(--ion-text-color)] text-sm m-0 mb-3">
          {user?.address || 'No address set'}
        </p>

        {user?.latitude != null && user?.longitude != null && (
          <p className="text-xs text-[var(--ion-color-primary)] mb-2">
            📍 {user.latitude.toFixed(6)}, {user.longitude.toFixed(6)}
          </p>
        )}
        <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-[var(--ion-border-color)] mb-3">
          <LeafletMap
            center={[user?.latitude || 14.5995, user?.longitude || 120.9842]}
            zoom={15}
            className="w-full h-full"
            dragging={false}
            scrollWheelZoom={false}
            touchZoom={false}
            doubleClickZoom={false}
          >
            {user?.latitude != null && user?.longitude != null && <Marker position={[user.latitude, user.longitude]} icon={profileMarkerIcon} />}
          </LeafletMap>
        </div>
        <OpenInGoogleMapsButton
          lat={user?.latitude}
          lng={user?.longitude}
          label={user?.address}
          caption="Tap to open this address in Google Maps."
          className="mb-3"
        />
        <IonButton expand="block" shape="round" className="h-12 text-base font-semibold" onClick={() => history.push('/customer/location')}>
          Edit Address
        </IonButton>
      </div>

      <IonButton expand="block" shape="round" className="min-h-[48px] font-semibold" onClick={handleSave} disabled={saving || !!emailError || !!phoneError || !name.trim() || !email.trim()}>
        {saving ? <IonSpinner name="crescent" style={{ width: 20, height: 20 }} /> : 'Save Changes'}
      </IonButton>

      <IonToast
        isOpen={showToast}
        message={toastMessage}
        duration={2000}
        position="bottom"
        onDidDismiss={() => setShowToast(false)}
      />

      <div className="xl:hidden w-full">
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
                <button
                  key={role}
                  disabled={disabled}
                  onClick={() => setActiveRole(role)}
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
      </div>

      <IonButton expand="block" shape="round" color="danger" className="xl:hidden min-h-[48px] font-semibold" onClick={() => { logout(); history.push('/guest/home'); }}>
        <IonIcon icon={logOutOutline} slot="start" />
        Sign Out
      </IonButton>
    </div>
  );
};

export default UserProfile;
