import { Router } from "express";

import { loginAdmin } from "../controllers/authController.js";
import {
  addDoctor,
  adminChangeAvailability,
  adminDashboard,
  allDoctors,
  appointmentCancel,
  appointmentsAdmin
} from "../controllers/adminController.js";
import { authAdmin } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/security.js";
import upload from "../middleware/upload.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { adminLoginSchema } from "../validators/authValidators.js";
import {
  addDoctorSchema,
  adminCancelAppointmentSchema,
  changeAvailabilitySchema
} from "../validators/adminValidators.js";

const adminRouter = Router();

adminRouter.post(
  "/login",
  authRateLimiter,
  validateRequest({ body: adminLoginSchema }),
  loginAdmin
);
adminRouter.post(
  "/add-doctor",
  authAdmin,
  upload.single("image"),
  validateRequest({ body: addDoctorSchema }),
  addDoctor
);
adminRouter.get("/appointments", authAdmin, appointmentsAdmin);
adminRouter.post(
  "/cancel-appointment",
  authAdmin,
  validateRequest({ body: adminCancelAppointmentSchema }),
  appointmentCancel
);
adminRouter.get("/all-doctors", authAdmin, allDoctors);
adminRouter.post(
  "/change-availability",
  authAdmin,
  validateRequest({ body: changeAvailabilitySchema }),
  adminChangeAvailability
);
adminRouter.get("/dashboard", authAdmin, adminDashboard);

export default adminRouter;
