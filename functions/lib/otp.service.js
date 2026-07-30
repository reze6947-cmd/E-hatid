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
exports.generateOtp = generateOtp;
exports.hashOtp = hashOtp;
exports.verifyOtpHash = verifyOtpHash;
exports.getClientInfo = getClientInfo;
exports.checkSendRateLimit = checkSendRateLimit;
exports.logSuspiciousActivity = logSuspiciousActivity;
const crypto = __importStar(require("node:crypto"));
const admin = __importStar(require("firebase-admin"));
const bcrypt = __importStar(require("bcryptjs"));
const https_1 = require("firebase-functions/v2/https");
const SALT_ROUNDS = 12;
function generateOtp() {
    const buf = crypto.randomBytes(3);
    const num = buf.readUIntBE(0, 3) % 900000 + 100000;
    return num.toString();
}
async function hashOtp(otp) {
    return bcrypt.hash(otp, SALT_ROUNDS);
}
async function verifyOtpHash(otp, hash) {
    return bcrypt.compare(otp, hash);
}
function getClientInfo(request) {
    const raw = request.rawRequest;
    const forwarded = raw.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : raw.ip) || 'unknown';
    const userAgent = raw.headers['user-agent'] || 'unknown';
    return { ip, userAgent };
}
async function checkSendRateLimit(uid, email, ip) {
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
            throw new https_1.HttpsError('resource-exhausted', `Please wait ${remaining}s before requesting a new OTP`);
        }
    }
    const tenMinAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 600000);
    const emailQuery = await otpRequestsRef
        .where('email', '==', email)
        .where('createdAt', '>=', tenMinAgo)
        .get();
    if (emailQuery.size >= 3) {
        throw new https_1.HttpsError('resource-exhausted', 'too-many-requests');
    }
    const ipQuery = await otpRequestsRef
        .where('ipAddress', '==', ip)
        .where('createdAt', '>=', tenMinAgo)
        .get();
    if (ipQuery.size >= 5) {
        await logSuspiciousActivity(uid, 'ip_rate_limited', `IP ${ip} exceeded send limit`);
        throw new https_1.HttpsError('resource-exhausted', 'too-many-requests');
    }
}
async function logSuspiciousActivity(uid, type, details) {
    await admin.firestore().collection('suspicious_activity').add({
        userId: uid,
        type,
        details,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}
