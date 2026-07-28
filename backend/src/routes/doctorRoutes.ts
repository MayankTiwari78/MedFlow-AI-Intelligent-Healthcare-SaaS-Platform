import { Router } from "express";

import { loginDoctor } from "../controllers/authController.js";
import {
  appointmentCancel,
  appointmentCheckIn,
  appointmentComplete,
  appointmentNoShow,
  appointmentsDoctor,
  availableSlots,
  callNext,
  changeAvailablity,
  createAppointmentMedicalRecord,
  doctorDashboard,
  doctorQueue,
  doctorList,
  doctorPatientMedicalRecords,
  doctorProfile,
  finalizeAppointmentMedicalRecord,
  ownAvailability,
  operationalComplete,
  recommendFollowUp,
  updateClinicalNotes,
  updateAppointmentMedicalRecord,
  updateOwnAvailability,
  updateDoctorProfile
} from "../controllers/doctorController.js";
import { authDoctor, authorizePermissions } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/security.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { loginSchema } from "../validators/authValidators.js";
import {
  availableSlotsParamsSchema,
  availableSlotsQuerySchema,
  clinicalNotesParamsSchema,
  doctorActionAppointmentSchema,
  updateClinicalNotesSchema,
  updateDoctorAvailabilitySchema,
  updateDoctorProfileSchema
  ,queueQuerySchema, followUpSchema
} from "../validators/doctorValidators.js";
import {
  appointmentMedicalRecordParamsSchema,
  medicalRecordCreateSchema,
  medicalRecordParamsSchema,
  medicalRecordUpdateSchema,
  patientMedicalRecordParamsSchema
} from "../validators/medicalRecordValidators.js";

const doctorRouter = Router();

doctorRouter.post("/login", authRateLimiter, validateRequest({ body: loginSchema }), loginDoctor);
doctorRouter.get(
  "/:doctorId/available-slots",
  validateRequest({ params: availableSlotsParamsSchema, query: availableSlotsQuerySchema }),
  availableSlots
);
doctorRouter.post(
  "/cancel-appointment",
  authDoctor,
  authorizePermissions("appointments:cancel"),
  validateRequest({ body: doctorActionAppointmentSchema }),
  appointmentCancel
);
doctorRouter.post("/check-in", authDoctor, authorizePermissions("appointments:update"), validateRequest({ body: doctorActionAppointmentSchema }), appointmentCheckIn);
doctorRouter.post("/no-show", authDoctor, authorizePermissions("appointments:update"), validateRequest({ body: doctorActionAppointmentSchema }), appointmentNoShow);
doctorRouter.get("/queue", authDoctor, authorizePermissions("appointments:read"), validateRequest({ query: queueQuerySchema }), doctorQueue);
doctorRouter.post("/queue/call-next", authDoctor, authorizePermissions("appointments:update"), validateRequest({ body: queueQuerySchema }), callNext);
doctorRouter.post("/appointments/:appointmentId/complete-operational", authDoctor, authorizePermissions("appointments:update"), validateRequest({ params: clinicalNotesParamsSchema }), operationalComplete);
doctorRouter.post("/appointments/:appointmentId/follow-up", authDoctor, authorizePermissions("appointments:update"), validateRequest({ params: clinicalNotesParamsSchema, body: followUpSchema }), recommendFollowUp);
doctorRouter.get(
  "/appointments",
  authDoctor,
  authorizePermissions("appointments:read"),
  appointmentsDoctor
);
doctorRouter.get("/list", doctorList);
doctorRouter.get(
  "/availability",
  authDoctor,
  authorizePermissions("doctors:read"),
  ownAvailability
);
doctorRouter.put(
  "/availability",
  authDoctor,
  authorizePermissions("doctors:manage"),
  validateRequest({ body: updateDoctorAvailabilitySchema }),
  updateOwnAvailability
);
doctorRouter.patch(
  "/appointments/:appointmentId/clinical-notes",
  authDoctor,
  authorizePermissions("appointments:update"),
  validateRequest({ params: clinicalNotesParamsSchema, body: updateClinicalNotesSchema }),
  updateClinicalNotes
);
doctorRouter.post(
  "/appointments/:appointmentId/medical-records",
  authDoctor,
  authorizePermissions("appointments:update"),
  validateRequest({
    params: appointmentMedicalRecordParamsSchema,
    body: medicalRecordCreateSchema
  }),
  createAppointmentMedicalRecord
);
doctorRouter.get(
  "/patients/:patientId/medical-records",
  authDoctor,
  authorizePermissions("appointments:read"),
  validateRequest({ params: patientMedicalRecordParamsSchema }),
  doctorPatientMedicalRecords
);
doctorRouter.patch(
  "/medical-records/:recordId",
  authDoctor,
  authorizePermissions("appointments:update"),
  validateRequest({ params: medicalRecordParamsSchema, body: medicalRecordUpdateSchema }),
  updateAppointmentMedicalRecord
);
doctorRouter.post(
  "/medical-records/:recordId/finalize",
  authDoctor,
  authorizePermissions("appointments:update"),
  validateRequest({ params: medicalRecordParamsSchema }),
  finalizeAppointmentMedicalRecord
);
doctorRouter.post(
  "/change-availability",
  authDoctor,
  authorizePermissions("doctors:manage"),
  changeAvailablity
);
doctorRouter.post(
  "/complete-appointment",
  authDoctor,
  authorizePermissions("appointments:update"),
  validateRequest({ body: doctorActionAppointmentSchema }),
  appointmentComplete
);
doctorRouter.get(
  "/dashboard",
  authDoctor,
  authorizePermissions("appointments:read"),
  doctorDashboard
);
doctorRouter.get("/profile", authDoctor, authorizePermissions("doctors:read"), doctorProfile);
doctorRouter.post(
  "/update-profile",
  authDoctor,
  authorizePermissions("doctors:manage"),
  validateRequest({ body: updateDoctorProfileSchema }),
  updateDoctorProfile
);

export default doctorRouter;
