# MedFlow AI

MedFlow AI is a healthcare SaaS platform with separate patient, doctor, and admin web clients backed by an Express API.

## Phase 1A and 1B Status

Phase 1A establishes the enterprise backend foundation:

- TypeScript backend source under `backend/src`
- Strict TypeScript checking and production compilation
- Centralized, validated environment configuration
- Typed Mongoose models preserving existing MongoDB field names
- Helmet, CORS allowlist, rate limiting, body limits, secure image upload validation
- JWT expiry with `Authorization: Bearer <token>` support
- Compatibility with legacy `token`, `aToken`, and `dToken` headers
- Central async error handling, application errors, 404 handling, health/readiness endpoints
- Zod validation for authentication, profiles, doctors, appointments, and payments
- Ownership checks for patient appointments, doctor appointments, and payment initialization
- Test suite that avoids real MongoDB, Cloudinary, Razorpay, and Stripe connections

Phase 1B adds enterprise authentication foundations:

- Unified auth service/controller/router architecture under `backend/src`
- Secure patient-only public registration with normalized emails and verification defaults
- Short-lived JWT access tokens with issuer, audience, token-type, and password-change checks
- Long-lived refresh tokens in secure HttpOnly cookies with rotation and reuse detection
- Authentication sessions with hashed refresh tokens, token families, revocation, activity, and TTL cleanup
- Email verification, resend verification, forgot password, reset password, and OTP challenges
- Development/test email outbox and production SMTP abstraction without logging secrets or raw tokens
- Auth-specific rate limits and origin checks for cookie-authenticated auth actions
- Legacy `/api/user`, `/api/doctor`, and `/api/admin` login compatibility with deprecated legacy headers
- Frontend/admin Axios compatibility for credentialed refresh-cookie support and one retry after 401

## Project Structure

```text
admin/      React/Vite admin and doctor panel
backend/    TypeScript Express API
frontend/   React/Vite patient app
```

Backend structure:

```text
backend/src/
  config/       environment, MongoDB, Cloudinary, payment clients
  controllers/  HTTP controllers
  middleware/   auth, validation, errors, uploads, security
  models/       typed Mongoose models
  routes/       API route definitions
  services/     business logic
  types/        shared TypeScript types
  validators/   Zod request schemas
  app.ts        Express app
  server.ts     runtime entrypoint
backend/tests/  Vitest/Supertest coverage
```

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Fill `backend/.env` with real local credentials. Do not commit `.env`.

Required backend environment variables:

- `NODE_ENV`
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `CLIENT_URL`
- `ADMIN_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `CLOUDINARY_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_SECRET_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `STRIPE_SECRET_KEY`
- `CURRENCY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `EMAIL_FROM`
- `EMAIL_VERIFICATION_EXPIRES_IN`
- `PASSWORD_RESET_EXPIRES_IN`
- `OTP_EXPIRES_IN`
- `OTP_MAX_ATTEMPTS`
- `AUTH_LOCK_MAX_ATTEMPTS`
- `AUTH_LOCK_DURATION`
- `COOKIE_NAME`
- `COOKIE_SAME_SITE`

## Backend Commands

```bash
npm run dev        # tsx development server
npm run build      # clean and compile to dist/
npm run start      # run compiled JavaScript
npm run typecheck  # strict TypeScript check
npm run lint       # ESLint
npm run format     # Prettier
npm run test       # Vitest/Supertest
```

## API Overview

Existing public API paths are preserved:

- `POST /api/user/register`
- `POST /api/user/login`
- `GET /api/user/get-profile`
- `POST /api/user/update-profile`
- `POST /api/user/book-appointment`
- `GET /api/user/appointments`
- `POST /api/user/cancel-appointment`
- `POST /api/user/payment-razorpay`
- `POST /api/user/verifyRazorpay`
- `POST /api/user/payment-stripe`
- `POST /api/user/verifyStripe`
- `POST /api/admin/login`
- `POST /api/admin/add-doctor`
- `GET /api/admin/appointments`
- `POST /api/admin/cancel-appointment`
- `GET /api/admin/all-doctors`
- `POST /api/admin/change-availability`
- `GET /api/admin/dashboard`
- `POST /api/doctor/login`
- `GET /api/doctor/list`
- `GET /api/doctor/appointments`
- `POST /api/doctor/cancel-appointment`
- `POST /api/doctor/complete-appointment`
- `POST /api/doctor/change-availability`
- `GET /api/doctor/dashboard`
- `GET /api/doctor/profile`
- `POST /api/doctor/update-profile`

Phase 1B auth API:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/patient/login`
- `POST /api/v1/auth/doctor/login`
- `POST /api/v1/auth/admin/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `POST /api/v1/auth/verify-email`
- `GET /api/v1/auth/verify-email?token=...`
- `POST /api/v1/auth/resend-verification`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/otp/request`
- `POST /api/v1/auth/otp/verify`

Health checks:

- `GET /health`
- `GET /ready`
- `GET /api/health`
- `GET /api/ready`

## Compatibility Notes

The backend returns the new `success`, `message`, and `data` response shape while also preserving legacy top-level fields used by the current React clients, such as `token`, `doctors`, `appointments`, `userData`, `profileData`, `dashData`, `order`, and `session_url`.

Legacy auth headers `token`, `aToken`, and `dToken` still work but are deprecated. New access-token clients should use `Authorization: Bearer <access-token>`. Refresh tokens are not returned in JSON and are stored only in the configured HttpOnly cookie.

Stripe verification now requires the backend-created Checkout Session id. The frontend verify page sends `session_id` back to `/api/user/verifyStripe`; the backend no longer marks payments as successful based only on a frontend `success=true` value.

## Upcoming Phases

These are intentionally not implemented in Phase 1B:

- Two-factor authentication
- Enterprise RBAC
- Full session-management dashboard
- Organization-scoped authorization
- Complete multi-tenancy
- Next.js migration
- AI features
- Docker
- Swagger

## Developer

Mayank Tiwari

GitHub: https://github.com/MayankTiwari78
