import os
import random
import smtplib
import time
import hashlib
from email.mime.text import MIMEText

from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:8100", "http://localhost"])

# ── SMTP config ─────────────────────────────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "")
OTP_EXPIRY = int(os.getenv("OTP_EXPIRY_SECONDS", "300"))
MAX_ATTEMPTS = 5
RESEND_COOLDOWN = 60

# In-memory OTP store: { email: { password, otp_hash, expires_at, attempts, last_sent_at } }
otp_store: dict = {}


def hash_otp(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def generate_otp() -> str:
    return str(random.randint(100000, 999999))


def send_email(to: str, code: str) -> None:
    body = f"""\
<html>
<body style="font-family: Arial, sans-serif; padding: 24px;">
  <h2>Email Verification</h2>
  <p>Your verification code is:</p>
  <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center;">
    {code}
  </p>
  <p>This code expires in 5 minutes.</p>
  <p>If you did not request this, please ignore this email.</p>
</body>
</html>"""

    msg = MIMEText(body, "html")
    msg["Subject"] = "Your Verification Code"
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM}>" if SMTP_FROM_NAME else SMTP_FROM
    msg["To"] = to

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)


@app.route("/send-otp", methods=["POST"])
def send_otp():
    data = request.get_json(force=True)
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"detail": "email and password required"}), 400

    existing = otp_store.get(email)
    if existing:
        last_sent = existing.get("last_sent_at", 0)
        if time.time() - last_sent < RESEND_COOLDOWN:
            remaining = int(RESEND_COOLDOWN - (time.time() - last_sent))
            return jsonify({"detail": f"Please wait {remaining}s before requesting a new code"}), 429

    code = generate_otp()
    otp_store[email] = {
        "password": password,
        "otp_hash": hash_otp(code),
        "expires_at": time.time() + OTP_EXPIRY,
        "attempts": 0,
        "last_sent_at": time.time(),
    }

    try:
        send_email(email, code)
    except Exception as exc:
        otp_store.pop(email, None)
        return jsonify({"detail": f"Failed to send email: {exc}"}), 500

    return jsonify({"message": "OTP sent"})


@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json(force=True)
    email = data.get("email")
    otp = data.get("otp")
    if not email or not otp:
        return jsonify({"detail": "email and otp required"}), 400

    entry = otp_store.get(email)
    if not entry:
        return jsonify({"detail": "No OTP found. Request a new code."}), 400

    if time.time() > entry["expires_at"]:
        otp_store.pop(email, None)
        return jsonify({"detail": "OTP_EXPIRED"}), 400

    if entry["attempts"] >= MAX_ATTEMPTS:
        otp_store.pop(email, None)
        return jsonify({"detail": "Too many failed attempts. Request a new code."}), 429

    if entry["otp_hash"] != hash_otp(otp):
        entry["attempts"] += 1
        remaining = MAX_ATTEMPTS - entry["attempts"]
        return jsonify({"detail": "INVALID_OTP", "attempts_remaining": remaining}), 400

    otp_store.pop(email, None)
    return jsonify({"message": "verified"})


@app.route("/resend-otp", methods=["POST"])
def resend_otp():
    data = request.get_json(force=True)
    email = data.get("email")
    if not email:
        return jsonify({"detail": "email required"}), 400

    entry = otp_store.get(email)
    if entry:
        last_sent = entry.get("last_sent_at", 0)
        if time.time() - last_sent < RESEND_COOLDOWN:
            remaining = int(RESEND_COOLDOWN - (time.time() - last_sent))
            return jsonify({"detail": f"Please wait {remaining}s before resending"}), 429
    else:
        entry = {
            "password": "",
            "otp_hash": "",
            "expires_at": time.time() + OTP_EXPIRY,
            "attempts": 0,
            "last_sent_at": 0,
        }
        otp_store[email] = entry

    code = generate_otp()
    entry["otp_hash"] = hash_otp(code)
    entry["expires_at"] = time.time() + OTP_EXPIRY
    entry["attempts"] = 0
    entry["last_sent_at"] = time.time()

    try:
        send_email(email, code)
    except Exception as exc:
        if email not in otp_store or not otp_store[email].get("password"):
            otp_store.pop(email, None)
        return jsonify({"detail": f"Failed to send email: {exc}"}), 500

    return jsonify({"message": "OTP resent"})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


def send_notification_email(to: str, subject: str, body_html: str) -> None:
    msg = MIMEText(body_html, "html")
    msg["Subject"] = subject
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM}>" if SMTP_FROM_NAME else SMTP_FROM
    msg["To"] = to
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)


@app.route("/notify-application", methods=["POST"])
def notify_application():
    data = request.get_json(force=True)
    email = data.get("email")
    role = data.get("role", "")
    if not email:
        return jsonify({"detail": "email required"}), 400
    body = f"""\
<html>
<body style="font-family: Arial, sans-serif; padding: 24px;">
  <h2>Application Submitted</h2>
  <p>Your <strong>{role}</strong> application has been submitted and is pending admin approval.</p>
  <p>You will be notified once your account is approved.</p>
</body>
</html>"""
    try:
        send_notification_email(email, f"Your {role} application is pending approval", body)
    except Exception as exc:
        return jsonify({"detail": f"Failed to send email: {exc}"}), 500
    return jsonify({"message": "notification sent"})


@app.route("/notify-approved", methods=["POST"])
def notify_approved():
    data = request.get_json(force=True)
    email = data.get("email")
    role = data.get("role", "")
    if not email:
        return jsonify({"detail": "email required"}), 400
    body = f"""\
<html>
<body style="font-family: Arial, sans-serif; padding: 24px;">
  <h2>Account Approved</h2>
  <p>Congratulations! Your <strong>{role}</strong> account has been approved.</p>
  <p>You can now log in and start using all {role} features.</p>
</body>
</html>"""
    try:
        send_notification_email(email, f"Your {role} account has been approved", body)
    except Exception as exc:
        return jsonify({"detail": f"Failed to send email: {exc}"}), 500
    return jsonify({"message": "notification sent"})


@app.route("/notify-rejected", methods=["POST"])
def notify_rejected():
    data = request.get_json(force=True)
    email = data.get("email")
    role = data.get("role", "")
    if not email:
        return jsonify({"detail": "email required"}), 400
    body = f"""\
<html>
<body style="font-family: Arial, sans-serif; padding: 24px;">
  <h2>Application Rejected</h2>
  <p>Your <strong>{role}</strong> application was rejected.</p>
  <p>If you believe this is a mistake, please contact support.</p>
</body>
</html>"""
    try:
        send_notification_email(email, f"Your {role} application was rejected", body)
    except Exception as exc:
        return jsonify({"detail": f"Failed to send email: {exc}"}), 500
    return jsonify({"message": "notification sent"})


if __name__ == "__main__":
    app.run(port=8000, debug=True)
