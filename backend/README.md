# MedFlow Backend

This backend has been migrated to a TypeScript Express architecture for Phase 1A.

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

## Environment

Copy `.env.example` to `.env` and provide local values. The database name must be part of `MONGODB_URI`; the backend no longer appends `/prescripto`.

Never commit real secrets.

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
- JSON and URL-encoded body limits
- Image MIME and size validation
- JWT expiry
- `Authorization: Bearer <token>` support
- Legacy `token`, `aToken`, and `dToken` support retained for current clients
- Sensitive fields removed from API responses
- Duplicate email errors returned as safe conflict responses

## Payment Notes

Razorpay verification validates the server-side signature and checks appointment ownership.

Stripe checkout now includes a server-created `session_id`. `/api/user/verifyStripe` verifies the Stripe session before marking an appointment as paid. Webhook-based reconciliation remains future work.

## Testing

Tests mock persistence and external providers. They do not connect to production MongoDB, Stripe, Razorpay, or Cloudinary.

Covered areas include:

- Health and readiness
- Registration and login validation
- Duplicate email handling
- Missing and invalid auth tokens
- Protected route access
- Invalid ObjectId handling
- Appointment ownership
- Payment ownership
- 404 responses
- Global error responses
