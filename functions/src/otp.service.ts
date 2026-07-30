import * as crypto from 'node:crypto';
import * as admin from 'firebase-admin';
import * as bcrypt from 'bcryptjs';
import type { CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';

const SALT_ROUNDS = 12;

export function generateOtp(): string {
  const buf = crypto.randomBytes(3);
  const num = buf.readUIntBE(0, 3) % 900000 + 100000;
  return num.toString();
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, SALT_ROUNDS);
}

export async function verifyOtpHash(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

export function getClientInfo(
  request: CallableRequest
): { ip: string; userAgent: string } {
  const raw = request.rawRequest;
  const forwarded = raw.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : raw.ip) || 'unknown';
  const userAgent = (raw.headers['user-agent'] as string) || 'unknown';
  return { ip, userAgent };
}

export async function checkSendRateLimit(
  uid: string,
  email: string,
  ip: string
): Promise<void> {
  const now = admin.firestore.Timestamp.now();
  const otpRequestsRef = admin.firestore().collection('otp_requests');

  const lastQuery = await otpRequestsRef
    .where('userId', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (!lastQuery.empty) {
    const last = lastQuery.docs[0].data();
    const elapsed = now.toMillis() - last.createdAt.toMillis();
    if (elapsed < 60000) {
      const remaining = Math.ceil((60000 - elapsed) / 1000);
      throw new HttpsError(
        'resource-exhausted',
        `Please wait ${remaining}s before requesting a new OTP`
      );
    }
  }

  const tenMinAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 600000);

  const emailQuery = await otpRequestsRef
    .where('email', '==', email)
    .where('createdAt', '>=', tenMinAgo)
    .get();

  if (emailQuery.size >= 3) {
    throw new HttpsError('resource-exhausted', 'too-many-requests');
  }

  const ipQuery = await otpRequestsRef
    .where('ipAddress', '==', ip)
    .where('createdAt', '>=', tenMinAgo)
    .get();

  if (ipQuery.size >= 5) {
    await logSuspiciousActivity(uid, 'ip_rate_limited', `IP ${ip} exceeded send limit`);
    throw new HttpsError('resource-exhausted', 'too-many-requests');
  }
}

export async function logSuspiciousActivity(
  uid: string,
  type: string,
  details: string
): Promise<void> {
  await admin.firestore().collection('suspicious_activity').add({
    userId: uid,
    type,
    details,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
