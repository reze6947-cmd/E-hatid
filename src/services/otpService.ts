import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';

export interface OtpError {
  code: string;
  message: string;
  type: 'unknown' | 'too-many-requests' | 'otp-expired' | 'invalid-otp' | 'unauthorized';
}

function parseOtpError(err: unknown): OtpError {
  const fbErr = err as { code?: string; message?: string } | undefined;
  const code = fbErr?.code || 'unknown';
  const message = fbErr?.message || 'An unexpected error occurred';

  let type: OtpError['type'] = 'unknown';
  if (message.includes('too-many-requests') || code === 'functions/resource-exhausted') {
    type = 'too-many-requests';
  } else if (message.includes('otp-expired') || code === 'functions/deadline-exceeded') {
    type = 'otp-expired';
  } else if (message.includes('invalid-otp') || code === 'functions/permission-denied') {
    type = 'invalid-otp';
  } else if (message.includes('unauthorized') || code === 'functions/unauthenticated') {
    type = 'unauthorized';
  }

  return { code, message, type };
}

const errorMessages: Record<OtpError['type'], string> = {
  unknown: 'An unexpected error occurred. Please try again.',
  'too-many-requests': 'Too many requests. Please wait a moment and try again.',
  'otp-expired': 'This OTP has expired. Please request a new one.',
  'invalid-otp': 'Invalid OTP code. Please check and try again.',
  unauthorized: 'Your session has expired. Please log in again.',
};

export function getOtpErrorMessage(error: OtpError): string {
  return errorMessages[error.type] || error.message;
}

export const sendOtpEmail = async (email: string): Promise<void> => {
  try {
    const fn = httpsCallable(functions, 'sendOtpEmail');
    await fn({ email });
  } catch (err) {
    const parsed = parseOtpError(err);
    throw parsed;
  }
};

export const verifyOtp = async (otp: string): Promise<void> => {
  try {
    const fn = httpsCallable(functions, 'verifyOtp');
    await fn({ otp });
  } catch (err) {
    const parsed = parseOtpError(err);
    throw parsed;
  }
};
