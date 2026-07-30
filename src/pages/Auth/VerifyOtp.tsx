import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonIcon,
  IonSpinner,
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

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
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
          <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-4 rounded-lg mb-6 text-sm border border-green-200 dark:border-green-800 flex items-start gap-3 text-left">
            <IonIcon icon={checkmarkCircleOutline} className="text-lg shrink-0 mt-0.5" />
            <span>OTP sent! Check your inbox and spam folder.</span>
          </div>
        )}

        <div className="mb-6">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={otp}
            onChange={handleOtpChange}
            placeholder="000000"
            className="w-full max-w-[280px] mx-auto text-center text-3xl sm:text-4xl font-bold tracking-[0.5em] px-4 py-4 rounded-xl border-2 border-[var(--ion-color-primary)] bg-[var(--ion-card-background)] text-[var(--ion-text-color)] outline-none focus:border-[var(--ion-color-primary-shade)] placeholder:text-[var(--ion-text-color-secondary)]/40"
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg mb-6 text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <IonButton
          expand="block"
          size="large"
          className="min-h-[48px]"
          style={{
            '--background': 'var(--ion-color-primary)',
            '--border-radius': '8px',
            fontSize: '15px',
            fontWeight: 700,
            marginBottom: '12px',
          }}
          onClick={handleVerify}
          disabled={otp.length !== 6 || verifying}
        >
          {verifying ? <IonSpinner /> : 'Verify OTP'}
        </IonButton>

        <IonButton
          expand="block"
          size="large"
          fill="outline"
          className="min-h-[48px]"
          style={{
            '--border-radius': '8px',
            fontSize: '15px',
            fontWeight: 600,
            marginBottom: '24px',
            '--border-color': 'var(--ion-color-primary)',
          }}
          onClick={handleSendOtp}
          disabled={cooldown > 0 || loading}
        >
          {loading ? <IonSpinner /> : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send OTP'}
        </IonButton>

        <button
          onClick={handleLogout}
          className="md:hidden w-full max-w-[280px] mx-auto h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-[#EF4444]/30 text-[#EF4444] font-semibold text-sm bg-transparent hover:bg-[#EF4444]/5 transition-colors mb-4"
        >
          <IonIcon icon={logOutOutline} className="text-base" />
          Log Out
        </button>

        <div className="text-sm text-[var(--ion-text-color-secondary)]">
          Didn't receive the code? Check your spam folder or{' '}
          <button
            onClick={handleSendOtp}
            disabled={cooldown > 0}
            className="text-[var(--ion-color-primary)] font-semibold bg-transparent border-none p-0 cursor-pointer underline disabled:opacity-50"
          >
            send again
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
