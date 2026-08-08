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
import { personOutline, mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline, calendarOutline, locationOutline, arrowBackOutline, alertCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAuthErrorMessage } from '../../services/authService';
import OpenInGoogleMapsButton from '../../components/ui/OpenInGoogleMapsButton';

const COUNTRY_CODES = [
  { code: '+63', label: 'PH +63' },
  { code: '+1', label: 'US +1' },
  { code: '+44', label: 'UK +44' },
  { code: '+65', label: 'SG +65' },
  { code: '+61', label: 'AU +61' },
  { code: '+81', label: 'JP +81' },
  { code: '+852', label: 'HK +852' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatPhone = (digits: string) => {
  const groups = [3, 3, 4];
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

const ageFromBirthDate = (d: string): number | undefined => {
  if (!d) return undefined;
  const b = new Date(d);
  if (isNaN(b.getTime())) return undefined;
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) years--;
  return years;
};

type FormErrors = {
  name?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  password?: string;
  confirmPassword?: string;
  agreed?: string;
};

const Register: React.FC = () => {
  const history = useHistory();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthDate: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [countryCode, setCountryCode] = useState('+63');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const clearError = (key: keyof FormErrors) => {
    setErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateField = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    clearError(key as keyof FormErrors);
  };

  const handlePhoneChange = (e: CustomEvent) => {
    const digits = (e.detail.value || '').replace(/\D/g, '').replace(/^0+/, '').slice(0, 10);
    setPhoneNumber(formatPhone(digits));
    clearError('phone');
  };

  const handleCountryCodeChange = (e: CustomEvent) => {
    const code = e.detail.value;
    setCountryCode(code);
    setPhoneNumber(formatPhone(phoneNumber.replace(/\D/g, '')));
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    const name = formData.name.trim();
    if (!name) e.name = 'Full name is required';
    else if (name.length < 2) e.name = 'Enter your full name';
    if (!formData.email.trim()) e.email = 'Email is required';
    else if (!EMAIL_RE.test(formData.email.trim())) e.email = 'Enter a valid email address';
    const phoneDigits = phoneNumber.replace(/\D/g, '');
    if (!phoneDigits) e.phone = 'Phone number is required';
    else if (phoneDigits.length < 7) e.phone = 'Phone must be at least 7 digits';
    if (!formData.birthDate) e.birthDate = 'Birth date is required';
    else {
      const d = new Date(formData.birthDate);
      if (isNaN(d.getTime()) || d.getTime() >= Date.now()) e.birthDate = 'Enter a valid birth date in the past';
    }
    if (!formData.password) e.password = 'Password is required';
    else if (formData.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!formData.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (formData.confirmPassword !== formData.password) e.confirmPassword = 'Passwords do not match';
    if (!agreed) e.agreed = 'Please agree to the Terms of Service and Privacy Policy';
    return e;
  };

  const scrollToError = () => {
    setTimeout(() => {
      document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleRegister = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    setSubmitError('');
    if (Object.keys(validationErrors).length > 0) {
      scrollToError();
      return;
    }
    setLoading(true);
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: `${countryCode}${phoneNumber.replace(/\D/g, '').replace(/^0+/, '')}`,
        birthDate: formData.birthDate,
        age: ageFromBirthDate(formData.birthDate),
        address: formData.address.trim(),
        password: formData.password,
      });
      history.push('/verify-otp');
      return;
    } catch (err) {
      setSubmitError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const itemStyle = (hasError: boolean): React.CSSProperties =>
    ({
      '--background': 'var(--ion-card-background)',
      '--border-radius': '12px',
      '--min-height': '48px',
      '--inner-box-shadow': 'none',
      border: hasError ? '1.5px solid var(--ion-color-danger)' : '1px solid var(--ion-border-color)',
    }) as React.CSSProperties;

  const renderError = (msg?: string) =>
    msg ? (
      <span className="flex items-center gap-1 text-xs text-[var(--ion-color-danger)] mt-1.5">
        <IonIcon icon={alertCircleOutline} className="text-sm shrink-0" />
        {msg}
      </span>
    ) : null;

  const label = (text: string, required?: boolean) => (
    <label className="block mb-2 text-xs font-semibold text-[var(--ion-text-color)] uppercase opacity-70">
      {text} {required && <span className="text-[var(--ion-color-danger)]">*</span>}
    </label>
  );

  const sectionTitle = (text: string) => (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-bold uppercase tracking-wider text-[var(--ion-text-color-secondary)]">{text}</span>
      <span className="flex-1 h-px bg-[var(--ion-border-color)]" />
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-30 -mt-4 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 bg-[var(--ion-card-background)]/90 backdrop-blur-md border-b border-[var(--ion-border-color)] shadow-sm">
        <IonButton fill="clear" onClick={() => history.goBack()} style={{ '--padding-start': '0', '--padding-end': '0', width: '44px', height: '44px' } as React.CSSProperties}>
          <IonIcon icon={arrowBackOutline} slot="icon-only" className="text-lg" />
        </IonButton>
      </div>

      <div className="w-full max-w-md mx-auto pt-8 sm:pt-10 pb-10">
        <div className="mb-8 sm:mb-10 text-center">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-[var(--ion-color-primary)] m-0 mb-2 sm:mb-3">
            Create Account
          </h1>
          <p className="text-sm sm:text-base text-[var(--ion-text-color-secondary)] m-0">
            Join our community of food lovers
          </p>
        </div>

        {submitError && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-xl mb-6 text-sm border border-red-200 dark:border-red-800">
            {submitError}
          </div>
        )}

        <div className="space-y-5 sm:space-y-6">
          <div>
            {sectionTitle('Account Information')}

            <div data-error={errors.name ? 'true' : undefined} className="mb-5">
              {label('Full Name', true)}
              <IonItem className="rounded-xl overflow-hidden" style={itemStyle(!!errors.name)}>
                <IonIcon icon={personOutline} slot="start" className="text-[var(--ion-color-primary)]" />
                <IonInput placeholder="Juan Dela Cruz" value={formData.name} onIonChange={e => updateField('name', e.detail.value || '')} className="[--padding-start:8px] [--color:var(--ion-text-color)]" />
              </IonItem>
              {renderError(errors.name)}
            </div>

            <div data-error={errors.email ? 'true' : undefined} className="mb-5">
              {label('Email', true)}
              <IonItem className="rounded-xl overflow-hidden" style={itemStyle(!!errors.email)}>
                <IonIcon icon={mailOutline} slot="start" className="text-[var(--ion-color-primary)]" />
                <IonInput type="email" inputmode="email" autocapitalize="none" placeholder="your@email.com" value={formData.email} onIonChange={e => updateField('email', e.detail.value || '')} className="[--padding-start:8px] [--color:var(--ion-text-color)]" />
              </IonItem>
              {renderError(errors.email)}
            </div>

            <div data-error={errors.phone ? 'true' : undefined} className="mb-5">
              {label('Phone', true)}
              <div className="flex gap-2">
                <IonItem className="rounded-xl overflow-hidden shrink-0" style={{ ...itemStyle(!!errors.phone), width: '120px' } as React.CSSProperties}>
                  <IonSelect value={countryCode} onIonChange={handleCountryCodeChange} interface="popover" className="[--color:var(--ion-text-color)] text-sm">
                    {COUNTRY_CODES.map(c => (
                      <IonSelectOption key={c.code} value={c.code}>{c.label}</IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
                <IonItem className="rounded-xl overflow-hidden flex-1 min-w-0" style={itemStyle(!!errors.phone)}>
                  <IonInput
                    type="tel"
                    inputmode="tel"
                    placeholder="912 345 6789"
                    value={phoneNumber}
                    onIonChange={handlePhoneChange}
                    className="[--padding-start:8px] [--color:var(--ion-text-color)]"
                  />
                </IonItem>
              </div>
              {renderError(errors.phone)}
            </div>

            <div data-error={errors.birthDate ? 'true' : undefined}>
              {label('Birth Date', true)}
              <IonItem className="rounded-xl overflow-hidden" style={itemStyle(!!errors.birthDate)}>
                <IonIcon icon={calendarOutline} slot="start" className="text-[var(--ion-color-primary)]" />
                <IonInput type="date" value={formData.birthDate} onIonChange={e => updateField('birthDate', e.detail.value || '')} className="[--padding-start:8px] [--color:var(--ion-text-color)]" />
              </IonItem>
              {renderError(errors.birthDate)}
            </div>
          </div>

          <div>
            {sectionTitle('Delivery Address')}

            <div>
              {label('Delivery Address')}
              <IonItem className="rounded-xl overflow-hidden" style={itemStyle(false)}>
                <IonIcon icon={locationOutline} slot="start" className="text-[var(--ion-color-primary)]" />
                <IonInput placeholder="House no., Street, Barangay, City" value={formData.address} onIonChange={e => updateField('address', e.detail.value || '')} className="[--padding-start:8px] [--color:var(--ion-text-color)]" />
              </IonItem>
              <OpenInGoogleMapsButton
                label={formData.address}
                caption="Opens this address in Google Maps so you can check it."
                className="mt-2"
              />
            </div>
          </div>

          <div>
            {sectionTitle('Security')}

            <div data-error={errors.password ? 'true' : undefined} className="mb-5">
              {label('Password', true)}
              <IonItem className="rounded-xl overflow-hidden" style={itemStyle(!!errors.password)}>
                <IonIcon icon={lockClosedOutline} slot="start" className="text-[var(--ion-color-primary)]" />
                <IonInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onIonChange={e => updateField('password', e.detail.value || '')}
                  className="[--padding-start:8px] [--color:var(--ion-text-color)]"
                />
                <IonButton fill="clear" slot="end" onClick={() => setShowPassword(!showPassword)} className="min-h-[44px] min-w-[44px]">
                  <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} className="text-[var(--ion-color-primary)]" />
                </IonButton>
              </IonItem>
              {renderError(errors.password)}
            </div>

            <div data-error={errors.confirmPassword ? 'true' : undefined}>
              {label('Confirm Password', true)}
              <IonItem className="rounded-xl overflow-hidden" style={itemStyle(!!errors.confirmPassword)}>
                <IonIcon icon={lockClosedOutline} slot="start" className="text-[var(--ion-color-primary)]" />
                <IonInput
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onIonChange={e => updateField('confirmPassword', e.detail.value || '')}
                  className="[--padding-start:8px] [--color:var(--ion-text-color)]"
                />
                <IonButton fill="clear" slot="end" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="min-h-[44px] min-w-[44px]">
                  <IonIcon icon={showConfirmPassword ? eyeOffOutline : eyeOutline} className="text-[var(--ion-color-primary)]" />
                </IonButton>
              </IonItem>
              {renderError(errors.confirmPassword)}
            </div>
          </div>

          <div data-error={errors.agreed ? 'true' : undefined}>
            <IonItem lines="none" className="mb-1" style={{ '--background': 'transparent' } as React.CSSProperties}>
              <IonCheckbox slot="start" className="me-3 shrink-0" checked={agreed} onIonChange={e => { setAgreed(e.detail.checked); clearError('agreed'); }} />
              <IonLabel className="text-xs text-[var(--ion-text-color-secondary)]">
                I agree to the <span className="text-[var(--ion-color-primary)] font-bold">Terms of Service</span> and{' '}
                <span className="text-[var(--ion-color-primary)] font-bold">Privacy Policy</span>
              </IonLabel>
            </IonItem>
            {renderError(errors.agreed)}
          </div>

          <IonButton
            expand="block"
            size="large"
            shape="round"
            className="min-h-[48px] font-bold"
            onClick={handleRegister}
          >
            Create Account
          </IonButton>

          <div className="text-center">
            <span className="text-sm text-[var(--ion-text-color-secondary)]">
              Already have an account?{' '}
              <span className="text-[var(--ion-color-primary)] font-bold cursor-pointer" onClick={() => history.push('/login')}>
                Sign In
              </span>
            </span>
          </div>

          <p className="text-center text-xs text-[var(--ion-text-color-secondary)] px-4">
            By registering, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      <IonLoading isOpen={loading} message="Creating account..." />
    </>
  );
};

export default Register;
