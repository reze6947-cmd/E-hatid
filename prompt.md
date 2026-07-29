https://e-hatid-backend.onrender.com
Service ID: srv-d9krtej7uimc7382gcq0


Outbound IP Addresses
Network requests from your service to the public internet will come from one of the following IP addresses or ranges.

These IP addresses are not unique to your service or workspace. They are shared by other Render services in the same region.


74.220.52.0/24
74.220.60.0/24
Need a unique, static outbound IP? Create a Dedicated IP.

✅ How it actually works
Frontend (Vercel)
        ↓ API call (HTTP)
Backend (Render)
        ↓
SMTP (Gmail)

So:

Vercel = your UI (React / Ionic)
Render = your backend API (Flask SMTP)
Connection = just HTTP requests (fetch/axios)
✅ What you SHOULD do
1. Deploy backend on Render

You already did this:

https://e-hatid-backend.onrender.com
2. Use that URL in your frontend (Vercel)

Set environment variable in Vercel:

NEXT_PUBLIC_API_BASE_URL=https://e-hatid-backend.onrender.com
3. Call it from your app
const API = process.env.NEXT_PUBLIC_API_BASE_URL;

await fetch(`${API}/send-otp`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email }),
});
✅ What you DO NOT need
❌ No linking accounts
❌ No special integration
❌ No Vercel ↔ Render config
⚠️ What you MUST do (important)
1. Enable CORS in backend
from flask_cors import CORS
CORS(app)
2. Use HTTPS (already handled by Render)
Don’t use http://
Always use:
https://e-hatid-backend.onrender.com
3. Handle delay (Render free tier)
First request = slow (cold start)
Add loading UI: “Sending OTP…”