import { Router } from "express";

import { loginDoctor } from "../controllers/authController.js";
import {
  appointmentCancel,
  appointmentComplete,
  appointmentsDoctor,
  changeAvailablity,
  doctorDashboard,
  doctorList,
  doctorProfile,
  updateDoctorProfile
} from "../controllers/doctorController.js";
import { authDoctor } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/security.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { loginSchema } from "../validators/authValidators.js";
import {
  doctorActionAppointmentSchema,
  updateDoctorProfileSchema
} from "../validators/doctorValidators.js";

const doctorRouter = Router();

doctorRouter.post("/login", authRateLimiter, validateRequest({ body: loginSchema }), loginDoctor);
doctorRouter.post(
  "/cancel-appointment",
  authDoctor,
  validateRequest({ body: doctorActionAppointmentSchema }),
  appointmentCancel
);
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor);
doctorRouter.get("/list", doctorList);
doctorRouter.post("/change-availability", authDoctor, changeAvailablity);
doctorRouter.post(
  "/complete-appointment",
  authDoctor,
  validateRequest({ body: doctorActionAppointmentSchema }),
  appointmentComplete
);
doctorRouter.get("/dashboard", authDoctor, doctorDashboard);
doctorRouter.get("/profile", authDoctor, doctorProfile);
doctorRouter.post(
  "/update-profile",
  authDoctor,
  validateRequest({ body: updateDoctorProfileSchema }),
  updateDoctorProfile
);

export default doctorRouter;
