"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtp = exports.sendOtpEmail = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const nodemailer = __importStar(require("nodemailer"));
const otp_service_js_1 = require("./otp.service.js");
admin.initializeApp();
const smtpHost = (0, params_1.defineString)('SMTP_HOST');
const smtpPort = (0, params_1.defineString)('SMTP_PORT');
const smtpUser = (0, params_1.defineString)('SMTP_USER');
const smtpPass = (0, params_1.defineString)('SMTP_PASS');
const smtpFrom = (0, params_1.defineString)('SMTP_FROM');
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
exports.sendOtpEmail = (0, https_1.onCall)({ region: "asia-southeast1" }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'unauthorized');
    }
    const data = request.data;
    const { email } = data;
    if (!email) {
        throw new https_1.HttpsError('invalid-argument', 'Email is required');
    }
    const uid = request.auth.uid;
    const { ip, userAgent } = (0, otp_service_js_1.getClientInfo)(request);
    await (0, otp_service_js_1.checkSendRateLimit)(uid, email, ip);
    const otp = (0, otp_service_js_1.generateOtp)();
    const otpHash = await (0, otp_service_js_1.hashOtp)(otp);
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
    }
    catch (emailErr) {
        console.warn(`[sendOtpEmail] SMTP failed for ${email}:`, emailErr);
        console.warn(`[sendOtpEmail] OTP for ${email} (uid=${uid}): ${otp}`);
    }
    return { success: true };
});
exports.verifyOtp = (0, https_1.onCall)({ region: "asia-southeast1" }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'unauthorized');
    }
    const data = request.data;
    const { otp } = data;
    if (!otp || !/^\d{6}$/.test(otp)) {
        throw new https_1.HttpsError('invalid-argument', 'Valid 6-digit OTP is required');
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
        throw new https_1.HttpsError('not-found', 'No active OTP request found. Request a new OTP.');
    }
    const doc = query.docs[0];
    const record = doc.data();
    if (now.toMillis() > record.expiresAt.toMillis()) {
        await doc.ref.update({ isUsed: true });
        throw new https_1.HttpsError('deadline-exceeded', 'otp-expired');
    }
    const newAttemptCount = (record.attemptCount || 0) + 1;
    await doc.ref.update({ attemptCount: newAttemptCount });
    if (newAttemptCount > record.maxAttempts) {
        await doc.ref.update({ isUsed: true });
        await (0, otp_service_js_1.logSuspiciousActivity)(uid, 'max_otp_attempts', `Exceeded ${record.maxAttempts} verify attempts`);
        throw new https_1.HttpsError('permission-denied', 'Too many failed attempts. Request a new OTP.');
    }
    const isValid = await (0, otp_service_js_1.verifyOtpHash)(otp, record.otpHash);
    if (!isValid) {
        throw new https_1.HttpsError('permission-denied', 'invalid-otp');
    }
    await doc.ref.update({ isUsed: true });
    await admin.firestore().doc(`users/${uid}`).update({
        emailVerified: true,
    });
    return { success: true, emailVerified: true };
});
