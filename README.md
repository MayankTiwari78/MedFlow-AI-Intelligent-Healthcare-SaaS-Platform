# MedFlow AI

MedFlow AI is a healthcare SaaS platform with separate patient, doctor, and admin web clients backed by an Express API.

## Phase 1A Status

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

Health checks:

- `GET /health`
- `GET /ready`
- `GET /api/health`
- `GET /api/ready`

## Compatibility Notes

The backend returns the new `success`, `message`, and `data` response shape while also preserving legacy top-level fields used by the current React clients, such as `token`, `doctors`, `appointments`, `userData`, `profileData`, `dashData`, `order`, and `session_url`.

Stripe verification now requires the backend-created Checkout Session id. The frontend verify page sends `session_id` back to `/api/user/verifyStripe`; the backend no longer marks payments as successful based only on a frontend `success=true` value.

## Upcoming Phases

These are intentionally not implemented in Phase 1A:

- Refresh tokens
- Email verification
- Forgot/reset password
- OTP
- Two-factor authentication
- Enterprise RBAC
- Session management
- Next.js migration
- AI features
- Docker
- Swagger

## Developer

Mayank Tiwari

GitHub: https://github.com/MayankTiwari78
