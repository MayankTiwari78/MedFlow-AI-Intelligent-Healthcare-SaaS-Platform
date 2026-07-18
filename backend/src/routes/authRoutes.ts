import { Router } from "express";

import {
  forgotPasswordRequest,
  loginAdmin,
  loginDoctor,
  loginUser,
  logout,
  logoutAll,
  refreshToken,
  registerUser,
  requestOtpChallenge,
  resendVerificationEmail,
  resetPasswordRequest,
  unifiedLogin,
  verifyEmail,
  verifyEmailLink,
  verifyOtpChallenge
} from "../controllers/authController.js";
import { authAny } from "../middleware/auth.js";
import {
  authRateLimiter,
  csrfOriginProtection,
  otpRateLimiter,
  passwordResetRateLimiter,
  refreshRateLimiter,
  registrationRateLimiter,
  verificationRateLimiter
} from "../middleware/security.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  adminLoginSchema,
  emptyBodySchema,
  forgotPasswordSchema,
  loginSchema,
  registerUserSchema,
  requestOtpSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  unifiedLoginSchema,
  verifyEmailSchema,
  verifyOtpSchema
} from "../validators/authValidators.js";

const authRouter = Router();

authRouter.post(
  "/register",
  registrationRateLimiter,
  validateRequest({ body: registerUserSchema }),
  registerUser
);
authRouter.post(
  "/login",
  authRateLimiter,
  validateRequest({ body: unifiedLoginSchema }),
  unifiedLogin
);
authRouter.post(
  "/patient/login",
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  loginUser
);
authRouter.post(
  "/doctor/login",
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  loginDoctor
);
authRouter.post(
  "/admin/login",
  authRateLimiter,
  validateRequest({ body: adminLoginSchema }),
  loginAdmin
);
authRouter.post(
  "/refresh",
  refreshRateLimiter,
  csrfOriginProtection,
  validateRequest({ body: emptyBodySchema }),
  refreshToken
);
authRouter.post(
  "/logout",
  csrfOriginProtection,
  validateRequest({ body: emptyBodySchema }),
  logout
);
authRouter.post(
  "/logout-all",
  csrfOriginProtection,
  authAny,
  validateRequest({ body: emptyBodySchema }),
  logoutAll
);
authRouter.post(
  "/verify-email",
  verificationRateLimiter,
  validateRequest({ body: verifyEmailSchema }),
  verifyEmail
);
authRouter.get("/verify-email", verificationRateLimiter, verifyEmailLink);
authRouter.post(
  "/resend-verification",
  verificationRateLimiter,
  validateRequest({ body: resendVerificationSchema }),
  resendVerificationEmail
);
authRouter.post(
  "/forgot-password",
  passwordResetRateLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  forgotPasswordRequest
);
authRouter.post(
  "/reset-password",
  passwordResetRateLimiter,
  validateRequest({ body: resetPasswordSchema }),
  resetPasswordRequest
);
authRouter.post(
  "/otp/request",
  otpRateLimiter,
  validateRequest({ body: requestOtpSchema }),
  requestOtpChallenge
);
authRouter.post(
  "/otp/verify",
  otpRateLimiter,
  validateRequest({ body: verifyOtpSchema }),
  verifyOtpChallenge
);

export default authRouter;
