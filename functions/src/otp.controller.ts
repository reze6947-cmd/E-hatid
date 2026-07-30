import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { defineString } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  getClientInfo,
  checkSendRateLimit,
  logSuspiciousActivity,
} from './otp.service.js';

admin.initializeApp();

const smtpHost = defineString('SMTP_HOST');
const smtpPort = defineString('SMTP_PORT');
const smtpUser = defineString('SMTP_USER');
const smtpPass = defineString('SMTP_PASS');
const smtpFrom = defineString('SMTP_FROM');

function createTransporter() {
  const port = Number(smtpPort.value());
  return nodemailer.createTransport({
    host: smtpHost.value(),
    port,
    secure: port === 465,
    auth: {
      user: smtpUser.value(),
      pass: smtpPass.value(),
    },
  });
}

export const sendOtpEmail = onCall(
  { region: "asia-southeast1" },
  async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'unauthorized');
  }

  const data = request.data as { email?: string };
  const { email } = data;
  if (!email) {
    throw new HttpsError('invalid-argument', 'Email is required');
  }

  const uid = request.auth.uid;
  const { ip, userAgent } = getClientInfo(request);

  await checkSendRateLimit(uid, email, ip);

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const now = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + 5 * 60 * 1000);

  await admin.firestore().collection('otp_requests').add({
    userId: uid,
    email,
    otpHash,
    createdAt: now,
    expiresAt,
    attemptCount: 0,
    maxAttempts: 5,
    isUsed: false,
    ipAddress: ip,
    userAgent,
  });

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: smtpFrom.value(),
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}. It expires in 5 minutes.`,
      html: `<p>Your OTP code is: <strong>${otp}</strong></p><p>It expires in 5 minutes.</p>`,
    });
  } catch (emailErr) {
    console.warn(`[sendOtpEmail] SMTP failed for ${email}:`, emailErr);
    console.warn(`[sendOtpEmail] OTP for ${email} (uid=${uid}): ${otp}`);
  }

  return { success: true };
});

export const verifyOtp = onCall(
  { region: "asia-southeast1" },
  async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'unauthorized');
  }

  const data = request.data as { otp?: string };
  const { otp } = data;
  if (!otp || !/^\d{6}$/.test(otp)) {
    throw new HttpsError('invalid-argument', 'Valid 6-digit OTP is required');
  }

  const uid = request.auth.uid;
  const now = admin.firestore.Timestamp.now();
  const otpRequestsRef = admin.firestore().collection('otp_requests');

  const query = await otpRequestsRef
    .where('userId', '==', uid)
    .where('isUsed', '==', false)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (query.empty) {
    throw new HttpsError('not-found', 'No active OTP request found. Request a new OTP.');
  }

  const doc = query.docs[0];
  const record = doc.data();

  if (now.toMillis() > record.expiresAt.toMillis()) {
    await doc.ref.update({ isUsed: true });
    throw new HttpsError('deadline-exceeded', 'otp-expired');
  }

  const newAttemptCount = (record.attemptCount || 0) + 1;
  await doc.ref.update({ attemptCount: newAttemptCount });

  if (newAttemptCount > record.maxAttempts) {
    await doc.ref.update({ isUsed: true });
    await logSuspiciousActivity(uid, 'max_otp_attempts', `Exceeded ${record.maxAttempts} verify attempts`);
    throw new HttpsError('permission-denied', 'Too many failed attempts. Request a new OTP.');
  }

  const isValid = await verifyOtpHash(otp, record.otpHash);
  if (!isValid) {
    throw new HttpsError('permission-denied', 'invalid-otp');
  }

  await doc.ref.update({ isUsed: true });
  await admin.firestore().doc(`users/${uid}`).update({
    emailVerified: true,
  });

  return { success: true, emailVerified: true };
});
