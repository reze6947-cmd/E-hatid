import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonInput,
} from '@ionic/react';
import { mailOutline, checkmarkCircleOutline, logOutOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { auth } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { roleHomePaths } from '../../config/routesByRole';
import {
  sendOtpEmail,
  verifyOtp,
  getOtpErrorMessage,
  OtpError,
} from '../../services/otpService';

const VerifyOtp: React.FC = () => {
  const history = useHistory();
  const { logout, refreshUser, roles } = useAuth();

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.currentUser?.email) {
      setEmail(auth.currentUser.email);
    }
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (cooldown > 0 || !auth.currentUser) return;
    setError(null);
    setLoading(true);
    try {
      await sendOtpEmail(email);
      setSent(true);
      setCooldown(60);
    } catch (err) {
      const otpErr = err as OtpError;
      setError(getOtpErrorMessage(otpErr));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6 || !auth.currentUser) return;
    setError(null);
    setVerifying(true);
    try {
      await verifyOtp(otp);
      setSent(false);
      await refreshUser();
      const target = roles.length === 1
        ? (roleHomePaths[roles[0]] || `/${roles[0]}/home`)
        : '/select-role';
      history.replace(target);
    } catch (err) {
      const otpErr = err as OtpError;
      setError(getOtpErrorMessage(otpErr));
      if (otpErr.type === 'otp-expired') {
        setSent(false);
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-8 sm:pt-12 md:pt-16 pb-32 sm:pb-40 text-center">
      <div className="px-4">
        <div className="w-20 h-20 rounded-full bg-[var(--ion-color-primary)]/10 flex items-center justify-center mx-auto mb-6">
          <IonIcon icon={mailOutline} className="text-4xl text-[var(--ion-color-primary)]" />
        </div>

        <h1 className="text-2xl xs:text-3xl font-extrabold text-[var(--ion-text-color)] m-0 mb-3">
          Verify your email
        </h1>
        <p className="text-sm sm:text-base text-[var(--ion-text-color-secondary)] m-0 mb-2">
          We sent an OTP code to
        </p>
        <p className="text-base font-semibold text-[var(--ion-color-primary)] m-0 mb-6">
          {email || 'your email'}
        </p>

        {sent && (
          <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-4 rounded-xl mb-6 text-sm border border-green-200 dark:border-green-800 flex items-start gap-3 text-left">
            <IonIcon icon={checkmarkCircleOutline} className="text-lg shrink-0 mt-0.5" />
            <span>OTP sent! Check your inbox and spam folder.</span>
          </div>
        )}

        <div className="mb-6">
          <IonInput
            type="text"
            inputMode="numeric"
            value={otp}
            placeholder="000000"
            onIonInput={e => {
              const val = e.detail.value!.replace(/\D/g, '').slice(0, 6);
              setOtp(val);
            }}
            className="w-full max-w-[280px] mx-auto text-center text-3xl sm:text-4xl font-bold tracking-[0.5em] [--color:var(--ion-text-color)] [--placeholder-color:var(--ion-text-color-secondary)] [--background:var(--ion-card-background)] [--padding-start:16px] [--padding-end:16px] [--padding-top:16px] [--padding-bottom:16px] border-2 border-[var(--ion-color-primary)] rounded-xl"
            style={{ '--border-radius': '12px', '--highlight-height': '0' } as any}
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-xl mb-6 text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <IonButton
          expand="block"
          size="large"
          shape="round"
          className="min-h-[48px] font-bold"
          onClick={handleVerify}
          disabled={otp.length !== 6 || verifying}
        >
          {verifying ? <IonSpinner /> : 'Verify OTP'}
        </IonButton>

        <IonButton
          expand="block"
          size="large"
          shape="round"
          fill="outline"
          className="min-h-[48px] font-semibold mt-3"
          onClick={handleSendOtp}
          disabled={cooldown > 0 || loading}
        >
          {loading ? <IonSpinner /> : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send OTP'}
        </IonButton>

        <IonButton
          expand="block"
          size="large"
          shape="round"
          fill="outline"
          color="danger"
          className="min-h-[48px] font-semibold mt-3 md:hidden"
          onClick={handleLogout}
        >
          <IonIcon icon={logOutOutline} slot="start" />
          Log Out
        </IonButton>

        <div className="text-sm text-[var(--ion-text-color-secondary)] mt-6">
          Didn't receive the code? Check your spam folder or{' '}
          <IonButton fill="clear" size="small" className="font-semibold underline align-baseline" onClick={handleSendOtp} disabled={cooldown > 0}>
            send again
          </IonButton>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
