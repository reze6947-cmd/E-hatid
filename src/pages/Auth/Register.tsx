import React, { useState } from 'react';
import {
  IonButton,
  IonInput,
  IonItem,
  IonIcon,
  IonLoading,
  IonCheckbox,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { personOutline, mailOutline, lockClosedOutline, callOutline, eyeOutline, eyeOffOutline, calendarOutline, arrowBackOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAuthErrorMessage } from '../../services/authService';

const COUNTRY_CODES = [
  { code: '+63', label: 'PH +63' },
  { code: '+1', label: 'US +1' },
  { code: '+44', label: 'UK +44' },
  { code: '+65', label: 'SG +65' },
  { code: '+61', label: 'AU +61' },
  { code: '+81', label: 'JP +81' },
  { code: '+852', label: 'HK +852' },
];

const Register: React.FC = () => {
  const history = useHistory();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [countryCode, setCountryCode] = useState('+63');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!agreed) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: `${countryCode}${phoneNumber.replace(/^0+/, '').replace(/\s/g, '')}`,
        age: formData.age ? Number(formData.age) : undefined,
        address: formData.address,
        password: formData.password,
      });
      history.push('/verify-otp');
      return;
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (d: string) => {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
  };

  return (
    <>
      <div className="sticky top-0 z-20 bg-[var(--ion-card-background)] border-b border-[var(--ion-border-color)]">
        <IonButton fill="clear" onClick={() => history.goBack()} style={{ '--padding-start': '0', '--padding-end': '0', width: '44px', height: '44px' } as any}>
          <IonIcon icon={arrowBackOutline} slot="icon-only" className="text-lg" />
        </IonButton>
      </div>

      <div className="max-w-md mx-auto pt-10 pb-36 px-4 sm:px-0">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--ion-color-primary)] m-0 mb-3">
            Create Account
          </h1>
          <p className="text-sm sm:text-base text-[var(--ion-text-color-secondary)] m-0">
            Join our community of food lovers
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-xl mb-6 text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-2 text-xs font-semibold text-[var(--ion-text-color)] uppercase opacity-70">Full Name</label>
          <IonItem className="rounded-xl overflow-hidden" style={{ '--background': 'var(--ion-card-background)', '--border-radius': '12px', '--min-height': '48px', '--inner-box-shadow': 'none' } as any}>
            <IonIcon icon={personOutline} slot="start" className="text-[var(--ion-color-primary)]" />
            <IonInput placeholder="Your full name" value={formData.name} onIonChange={e => setFormData({...formData, name: e.detail.value!})} className="[--color:var(--ion-text-color)]" />
          </IonItem>
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-xs font-semibold text-[var(--ion-text-color)] uppercase opacity-70">Email</label>
          <IonItem className="rounded-xl overflow-hidden" style={{ '--background': 'var(--ion-card-background)', '--border-radius': '12px', '--min-height': '48px', '--inner-box-shadow': 'none' } as any}>
            <IonIcon icon={mailOutline} slot="start" className="text-[var(--ion-color-primary)]" />
            <IonInput type="email" placeholder="your@email.com" value={formData.email} onIonChange={e => setFormData({...formData, email: e.detail.value!})} className="[--color:var(--ion-text-color)]" />
          </IonItem>
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-xs font-semibold text-[var(--ion-text-color)] uppercase opacity-70">Phone</label>
          <div className="flex gap-0">
            <IonItem className="rounded-l-xl overflow-hidden shrink-0" style={{ '--background': 'var(--ion-card-background)', '--border-radius': '12px 0 0 12px', '--min-height': '48px', '--inner-box-shadow': 'none', width: '120px' } as any}>
              <IonSelect value={countryCode} onIonChange={e => setCountryCode(e.detail.value)} interface="popover" className="[--color:var(--ion-text-color)] text-sm">
                {COUNTRY_CODES.map(c => (
                  <IonSelectOption key={c.code} value={c.code}>{c.label}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem className="rounded-r-xl overflow-hidden flex-1" style={{ '--background': 'var(--ion-card-background)', '--border-radius': '0 12px 12px 0', '--min-height': '48px', '--inner-box-shadow': 'none' } as any}>
              <IonInput
                type="tel"
                placeholder="912 345 6789"
                value={formatPhone(phoneNumber)}
                onIonChange={e => {
                  const digits = e.detail.value!.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10);
                  setPhoneNumber(digits);
                }}
                className="[--color:var(--ion-text-color)]"
              />
            </IonItem>
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-xs font-semibold text-[var(--ion-text-color)] uppercase opacity-70">Age</label>
          <IonItem className="rounded-xl overflow-hidden" style={{ '--background': 'var(--ion-card-background)', '--border-radius': '12px', '--min-height': '48px', '--inner-box-shadow': 'none' } as any}>
            <IonIcon icon={calendarOutline} slot="start" className="text-[var(--ion-color-primary)]" />
            <IonInput type="number" placeholder="Your age" value={formData.age} onIonChange={e => setFormData({...formData, age: e.detail.value!})} className="[--color:var(--ion-text-color)]" />
          </IonItem>
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-xs font-semibold text-[var(--ion-text-color)] uppercase opacity-70">Delivery Address</label>
          <IonItem className="rounded-xl overflow-hidden" style={{ '--background': 'var(--ion-card-background)', '--border-radius': '12px', '--min-height': '48px', '--inner-box-shadow': 'none' } as any}>
            <IonInput placeholder="Enter your delivery address" value={formData.address} onIonChange={e => setFormData({...formData, address: e.detail.value!})} className="[--color:var(--ion-text-color)]" />
          </IonItem>
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-xs font-semibold text-[var(--ion-text-color)] uppercase opacity-70">Password</label>
          <IonItem className="rounded-xl overflow-hidden" style={{ '--background': 'var(--ion-card-background)', '--border-radius': '12px', '--min-height': '48px', '--inner-box-shadow': 'none' } as any}>
            <IonIcon icon={lockClosedOutline} slot="start" className="text-[var(--ion-color-primary)]" />
            <IonInput
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onIonChange={e => setFormData({...formData, password: e.detail.value!})}
              className="[--color:var(--ion-text-color)]"
            />
            <IonButton fill="clear" slot="end" onClick={() => setShowPassword(!showPassword)} className="min-h-[44px] min-w-[44px]">
              <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} className="text-[var(--ion-color-primary)]" />
            </IonButton>
          </IonItem>
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-xs font-semibold text-[var(--ion-text-color)] uppercase opacity-70">Confirm Password</label>
          <IonItem className="rounded-xl overflow-hidden" style={{ '--background': 'var(--ion-card-background)', '--border-radius': '12px', '--min-height': '48px', '--inner-box-shadow': 'none' } as any}>
            <IonIcon icon={lockClosedOutline} slot="start" className="text-[var(--ion-color-primary)]" />
            <IonInput type="password" placeholder="••••••••" value={formData.confirmPassword} onIonChange={e => setFormData({...formData, confirmPassword: e.detail.value!})} className="[--color:var(--ion-text-color)]" />
          </IonItem>
        </div>

        <IonItem lines="none" className="mb-6" style={{ '--background': 'transparent' } as any}>
          <IonCheckbox slot="start" checked={agreed} onIonChange={e => setAgreed(e.detail.checked)} />
          <IonLabel className="text-xs text-[var(--ion-text-color-secondary)]">
            I agree to the <span className="text-[var(--ion-color-primary)] font-bold">Terms of Service</span> and{' '}
            <span className="text-[var(--ion-color-primary)] font-bold">Privacy Policy</span>
          </IonLabel>
        </IonItem>

        <IonButton
          expand="block"
          size="large"
          shape="round"
          className="min-h-[48px] font-bold"
          onClick={handleRegister}
        >
          Create Account
        </IonButton>

        <div className="text-center mt-6">
          <span className="text-sm text-[var(--ion-text-color-secondary)]">
            Already have an account?{' '}
            <span className="text-[var(--ion-color-primary)] font-bold cursor-pointer" onClick={() => history.push('/login')}>
              Sign In
            </span>
          </span>
        </div>
      </div>

      <p className="text-center mt-8 mb-4 text-xs text-[var(--ion-text-color-secondary)] px-4">
        By registering, you agree to our Terms of Service and Privacy Policy
      </p>
      <IonLoading isOpen={loading} message="Creating account..." />
    </>
  );
};

export default Register;
