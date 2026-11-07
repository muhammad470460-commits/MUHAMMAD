# Security & Hardening Guide

## 1. Secrets & Credentials Management
- Never commit actual API keys, private passwords, or JWT secrets to public git repositories.
- Use `.env` file loaded via environment variables in production.
- Use strong random 64-character JWT secrets (`openssl rand -hex 32`).

## 2. Authentication & Session Security
- Passwords must be hashed using bcrypt or argon2 (minimum salt rounds: 10).
- Auth tokens are issued with explicit expiration (7 days).
- Cookies are configured with `SameSite=Lax`, `HttpOnly`, and `Secure` flags.

## 3. Data Protection
- Phone numbers and financial ledger balances are validated server-side.
- Client cannot tamper with profit calculations; all accruals are server-authoritative.
- Uploaded receipt screenshots are scanned and restricted to image MIME types (JPEG, PNG, WEBP) with maximum 5MB size limit.

## 4. Rate Limiting
- Login and registration routes are protected against brute force attacks.
- Financial submission routes (deposits/withdrawals) require authenticated sessions.
