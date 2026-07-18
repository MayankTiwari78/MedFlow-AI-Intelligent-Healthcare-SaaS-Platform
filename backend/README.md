# MedFlow Backend

This backend uses the TypeScript Express architecture established in Phase 1A and the enterprise authentication foundation added in Phase 1B.

## Architecture

```text
src/
  config/       validated environment, database, Cloudinary, payment clients
  controllers/  HTTP request/response adapters
  middleware/   security, auth, validation, uploads, errors
  models/       typed Mongoose schemas
  routes/       endpoint registration
  services/     business logic and ownership checks
  types/        shared domain and Express types
  validators/   Zod schemas
  app.ts        Express app without network side effects
  server.ts     runtime startup and graceful shutdown
tests/          isolated Vitest/Supertest tests
```

Phase 1B authentication is split by responsibility:

- `routes/authRoutes.ts`: `/api/v1/auth` endpoint definitions
- `controllers/authController.ts`: HTTP input/output, cookies, and safe response shape
- `services/authService.ts`: registration, login, refresh, logout, verification, recovery, and OTP business flows
- `services/accountService.ts`: unified patient, doctor, and env-backed admin account adapter
- `services/authSessionService.ts`: refresh-token sessions, rotation, family revocation, and reuse detection
- `services/authChallengeService.ts`: token/OTP challenge creation, cooldowns, attempts, consumption, and revocation
- `services/emailService.ts`: SMTP delivery abstraction and safe development/test outbox
- `services/tokenService.ts`: access/refresh JWT signing and verification
- `models/AuthSession.ts` and `models/AuthChallenge.ts`: persistence foundation for refresh tokens and challenges

## Environment

Copy `.env.example` to `.env` and provide local values. The database name must be part of `MONGODB_URI`; the backend no longer appends `/prescripto`.

Never commit real secrets.

Phase 1B auth variables:

- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`: separate secrets for access and refresh tokens. Production requires both and they must differ.
- `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`: examples are `15m` and `30d`.
- `JWT_ISSUER`, `JWT_AUDIENCE`: validated on signed tokens.
- `COOKIE_NAME`, `COOKIE_SAME_SITE`: refresh-token cookie name and SameSite mode.
- `EMAIL_VERIFICATION_EXPIRES_IN`, `PASSWORD_RESET_EXPIRES_IN`, `OTP_EXPIRES_IN`, `OTP_MAX_ATTEMPTS`: challenge lifetime and brute-force limits.
- `AUTH_LOCK_MAX_ATTEMPTS`, `AUTH_LOCK_DURATION`: temporary lockout after repeated failed login.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`: production SMTP delivery.
- `CLIENT_URL`, `ADMIN_URL`: CORS allowlist and auth-origin checks.

`JWT_SECRET` remains as a transitional legacy-token secret and fallback in non-production. New production deployments should use distinct access and refresh secrets.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
npm run start
```

`npm run start` runs compiled JavaScript from `dist/server.js`.

## Security Foundation

- Helmet headers
- CORS restricted to `CLIENT_URL` and `ADMIN_URL`
- General and auth rate limits
- Registration, refresh, verification, password-reset, and OTP rate limits
- JSON and URL-encoded body limits
- Image MIME and size validation
- JWT expiry, issuer, audience, and token-type validation
- Short-lived access tokens
- Refresh tokens stored only in HttpOnly cookies
- Refresh-token rotation after every successful refresh
- Refresh-token reuse detection with token-family revocation
- Authentication sessions with hashed current refresh tokens
- Account statuses, email verification flags, failed attempts, lockout, password-change invalidation, and login tracking
- Email verification and password-reset token hashes only
- OTP hashes only, purpose binding, max attempts, resend cooldowns, and one-time consumption
- Origin protection for cookie-authenticated auth endpoints
- `Authorization: Bearer <token>` support
- Legacy `token`, `aToken`, and `dToken` support retained for current clients
- Sensitive fields removed from API responses
- Duplicate email errors returned as safe conflict responses

## Authentication Flows

Registration:

1. Public registration accepts only patient accounts.
2. Email is normalized and checked across patient, doctor, and admin identities.
3. Password policy requires at least 12 characters with uppercase, lowercase, number, and symbol.
4. The patient is created as `PENDING_VERIFICATION` and `emailVerified=false`.
5. A single-use verification challenge is stored as a hash and delivered by email.
6. The response does not include a refresh token, raw verification token, OTP, or password hash.

Login:

1. Email is normalized and invalid credential failures use generic messages.
2. Passwords are compared with bcrypt.
3. Account status, verification policy, lockout, and failed attempts are enforced.
4. A short-lived access token is returned and a long-lived refresh token is placed in a secure HttpOnly cookie.
5. Existing patient, doctor, and admin login paths still return top-level `token` for compatibility.

Refresh:

1. `POST /api/v1/auth/refresh` reads the refresh cookie.
2. The refresh JWT must use the refresh secret and `tokenType=refresh`.
3. The session must be current, unexpired, and unrevoked, and its stored hash must match the presented token.
4. A new refresh token is issued and the old hash is atomically replaced.
5. Reuse of a rotated/revoked token revokes the token family.

Logout:

- `POST /api/v1/auth/logout` revokes the current refresh session when a refresh cookie is present and clears the cookie.
- `POST /api/v1/auth/logout-all` requires an access token and revokes all sessions for that account.
- Password reset also revokes all sessions for the account.

Email verification, recovery, and OTP:

- Verification and reset tokens are cryptographically random; only HMAC hashes are stored.
- Forgot-password returns the same generic response whether or not an account exists.
- Reset rejects expired, used, invalid, weak, or reused-password challenges.
- OTP challenges support `EMAIL_VERIFICATION`, `PASSWORD_RESET`, and `LOGIN_VERIFICATION`; TOTP/2FA is intentionally not implemented in Phase 1B.

## Migration and Backfill

The schema adds auth metadata to existing patient and doctor documents. Run the idempotent backfill only against an intended environment:

```bash
cd backend
npx tsx src/scripts/backfillAuthAccounts.ts
```

The script:

- Sets missing `normalizedEmail` values from existing email fields.
- Sets missing `emailVerified`, `accountStatus`, `failedLoginAttempts`, and `authenticationProvider` defaults.
- Reports duplicate normalized emails before any unique-index work.
- Does not assign privileged roles.
- Does not delete, lock, or overwrite legitimate accounts.
- Does not run automatically during server startup.

Review duplicate reports before adding any future unique normalized-email indexes.

## Payment Notes

Razorpay verification validates the server-side signature and checks appointment ownership.

Stripe checkout now includes a server-created `session_id`. `/api/user/verifyStripe` verifies the Stripe session before marking an appointment as paid. Webhook-based reconciliation remains future work.

## Testing

Tests mock persistence and external providers. They do not connect to production MongoDB, Stripe, Razorpay, or Cloudinary.

Covered areas include:

- Health and readiness
- Secure registration and login validation
- Duplicate email handling
- Privileged-role injection protection
- Unverified, suspended, and locked login behavior
- Access-token validation, wrong token type, and password-change invalidation
- Refresh rotation, old-token invalidation, reuse detection, logout, and logout-all
- Email verification, used-token rejection, password recovery, session revocation, and OTP purpose binding
- Missing and invalid auth tokens
- Protected route access
- Invalid ObjectId handling
- Appointment ownership
- Payment ownership
- 404 responses
- Global error responses
