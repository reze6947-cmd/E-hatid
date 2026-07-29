You are a Senior Backend Engineer. Apply fixes to my existing Flask SMTP backend with the following STRICT rules:

CONSTRAINTS (VERY IMPORTANT):

* DO NOT restructure the project
* DO NOT rename files
* DO NOT change existing routes or API endpoints
* DO NOT modify business logic (OTP generation, verification flow)
* ONLY improve reliability, prevent timeouts, and fix CORS
* Keep changes minimal and safe
* Avoid scanning unrelated files

GOALS:

1. Fix SMTP timeout causing Gunicorn worker crash
2. Prevent blocking request during email sending
3. Ensure proper CORS headers for Vercel frontend
4. Maintain existing API behavior

IMPLEMENTATION STEPS:

1. UPDATE SMTP FUNCTION

* Add timeout to SMTP connection (10 seconds)
* Wrap in try/catch
* Return success boolean instead of crashing

Expected pattern:

* Use smtplib.SMTP(host, port, timeout=10)
* Use starttls()
* Use login()
* Use send_message()
* Catch exceptions and log error

2. MAKE EMAIL SENDING NON-BLOCKING

* Create a new helper function using threading
* Run email sending in a background thread
* DO NOT wait for SMTP inside request handler

Pattern:

* threading.Thread(target=send_email, args=(email, code)).start()

3. MODIFY ROUTES THAT SEND EMAIL (e.g. /send-otp, /resend-otp)

* Replace direct send_email(...) with async version
* Always return success response immediately
* Do not block response waiting for SMTP

4. ADD CORS SUPPORT

* Install flask-cors if missing
* Enable CORS globally

Pattern:
from flask_cors import CORS
CORS(app, resources={r"/*": {"origins": "*"}})

OR restrict to:
https://e-hatid.vercel.app

5. DO NOT CHANGE:

* Request/response JSON structure
* Endpoint names (/send-otp, /resend-otp, /verify-otp)
* Existing OTP logic
* Firebase or database logic (if any)

6. OPTIONAL SAFE IMPROVEMENTS:

* Add print logs for SMTP errors
* Ensure environment variables are used (SMTP_EMAIL, SMTP_PASSWORD, SMTP_HOST, SMTP_PORT)

EXPECTED RESULT:

* No more Gunicorn WORKER TIMEOUT
* API responds instantly
* Emails send in background
* No more CORS errors from Vercel
* System remains fully compatible with existing frontend

IMPORTANT:
If unsure about any part of the system, DO NOT modify it. Only apply the changes above.
