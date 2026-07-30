# OTP System — Implementation Summary

## Architecture

```
functions/
  src/
    index.ts              — Re-exports from controller
    otp.controller.ts     — sendOtpEmail + verifyOtp callable functions
    otp.service.ts        — Helpers (generateOtp, hashOtp, rate limits, IP tracking)
src/
  services/
    otpService.ts         — Frontend httpsCallable wrapper with typed errors
  pages/Auth/
    VerifyOtp.tsx         — OTP verification UI
  firebaseConfig.ts       — Firebase init (region: asia-southeast1)
```

## Firestore Collections

| Collection | Access | Purpose |
|------------|--------|---------|
| `otp_requests` | Functions only (rules block client) | OTP hashes, attempts, expiry |
| `suspicious_activity` | Admins read, Functions write | Abuse logging |

## Deployed Functions (asia-southeast1)

| Function | Runtime | Auth Required |
|----------|---------|---------------|
| `sendOtpEmail` | Node.js 22 | Yes |
| `verifyOtp` | Node.js 22 | Yes |

## Rate Limits

- 60s cooldown between requests per user
- Max 3 OTP requests per email per 10 minutes
- Max 5 requests per IP per 10 minutes
- Max 5 verify attempts per OTP

## To Enable Email Sending

Edit `functions/.env` with real SMTP credentials:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_api_key
SMTP_FROM=noreply@yourdomain.com
```

Then rebuild and redeploy:

```powershell
cd functions; npm run build; firebase deploy --only functions
```

## Deploy Commands

```powershell
# Functions only
cd functions; npm run build; firebase deploy --only functions

# Full deploy (functions + firestore rules)
firebase deploy
```

## Common Issues

- **CORS / ERR_BLOCKED_BY_CLIENT**: Disable browser adblockers for localhost, or test in Incognito
- **500 on sendOtpEmail**: SMTP credentials not set — OTP is logged to Firebase console logs
