import { auth } from '../firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  UserCredential,
  User as FirebaseUser,
} from 'firebase/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const loginUser = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const registerUser = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const logoutUser = () => signOut(auth);

export const sendVerificationEmail = (user: FirebaseUser) =>
  sendEmailVerification(user);

export const onAuthChanged = (callback: (user: FirebaseUser | null) => void) =>
  onAuthStateChanged(auth, callback);

export const sendOtp = async (data: { email: string; password: string }) => {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error('Cannot connect to verification service. Make sure the backend is running.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to send OTP' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
};

export const verifyOtp = async (data: { email: string; otp: string }) => {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error('Cannot connect to verification service. Make sure the backend is running.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Verification failed' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
};

export const resendOtp = async (email: string) => {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new Error('Cannot connect to verification service. Make sure the backend is running.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to resend OTP' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
};

const errorMessages: Record<string, string> = {
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect password',
  'auth/invalid-email': 'Invalid email address',
  'auth/email-already-in-use': 'An account with this email already exists',
  'auth/weak-password': 'Password should be at least 6 characters',
  'auth/invalid-credential': 'Invalid email or password',
  'auth/too-many-requests': 'Too many attempts. Please try again later',
  'auth/network-request-failed': 'Network error. Check your connection',
};

export const signInUser = (email: string, password: string): Promise<UserCredential> =>
  signInWithEmailAndPassword(auth, email, password);

export const createUserAfterOtp = (email: string, password: string): Promise<UserCredential> =>
  createUserWithEmailAndPassword(auth, email, password);

export const sendApplicationNotification = async (email: string, role: string) => {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/notify-application`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
  } catch {
    throw new Error('Cannot connect to notification service.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to send notification' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
};

export const sendApprovedNotification = async (email: string, role: string) => {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/notify-approved`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
  } catch {
    throw new Error('Cannot connect to notification service.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to send notification' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
};

export const sendRejectedNotification = async (email: string, role: string) => {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/notify-rejected`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
  } catch {
    throw new Error('Cannot connect to notification service.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to send notification' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
};

export const getAuthErrorMessage = (error: unknown): string => {
  const code = (error as any)?.code as string | undefined;
  return errorMessages[code || ''] || (error as Error)?.message || 'An unexpected error occurred';
};
