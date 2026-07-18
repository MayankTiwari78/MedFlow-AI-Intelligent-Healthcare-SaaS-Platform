import { Router } from "express";

import { loginUser, registerUser } from "../controllers/authController.js";
import {
  bookAppointment,
  cancelAppointment,
  getProfile,
  listAppointment,
  paymentRazorpay,
  paymentStripe,
  updateProfile,
  verifyRazorpay,
  verifyStripe
} from "../controllers/userController.js";
import { authRateLimiter, registrationRateLimiter } from "../middleware/security.js";
import { authUser } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { loginSchema, registerUserSchema } from "../validators/authValidators.js";
import {
  bookAppointmentSchema,
  cancelAppointmentSchema,
  paymentInitSchema,
  updateProfileSchema,
  verifyRazorpaySchema,
  verifyStripeSchema
} from "../validators/userValidators.js";

const userRouter = Router();

userRouter.post(
  "/register",
  registrationRateLimiter,
  validateRequest({ body: registerUserSchema }),
  registerUser
);
userRouter.post("/login", authRateLimiter, validateRequest({ body: loginSchema }), loginUser);

userRouter.get("/get-profile", authUser, getProfile);
userRouter.post(
  "/update-profile",
  authUser,
  upload.single("image"),
  validateRequest({ body: updateProfileSchema }),
  updateProfile
);
userRouter.post(
  "/book-appointment",
  authUser,
  validateRequest({ body: bookAppointmentSchema }),
  bookAppointment
);
userRouter.get("/appointments", authUser, listAppointment);
userRouter.post(
  "/cancel-appointment",
  authUser,
  validateRequest({ body: cancelAppointmentSchema }),
  cancelAppointment
);
userRouter.post(
  "/payment-razorpay",
  authUser,
  validateRequest({ body: paymentInitSchema }),
  paymentRazorpay
);
userRouter.post(
  "/verifyRazorpay",
  authUser,
  validateRequest({ body: verifyRazorpaySchema }),
  verifyRazorpay
);
userRouter.post(
  "/payment-stripe",
  authUser,
  validateRequest({ body: paymentInitSchema }),
  paymentStripe
);
userRouter.post(
  "/verifyStripe",
  authUser,
  validateRequest({ body: verifyStripeSchema }),
  verifyStripe
);

export default userRouter;
