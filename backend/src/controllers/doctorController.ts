import type { RequestHandler } from "express";

import {
  cancelDoctorAppointment,
  changeDoctorAvailability,
  getDoctorDashboard,
  getOwnDoctorAvailability,
  getDoctorProfile,
  listDoctorAppointments,
  listPublicDoctors,
  updateDoctorClinicalNotes,
  updateOwnDoctorAvailability,
  updateDoctorProfile as updateDoctorProfileService
} from "../services/doctorService.js";
import { listDoctorAvailableSlots } from "../services/availabilityService.js";
import { writeAuditLog } from "../services/auditService.js";
import {
  createDoctorMedicalRecord,
  finalizeDoctorMedicalRecord,
  listDoctorPatientRecords,
  updateDoctorMedicalRecord,
  type MedicalRecordPayload,
  type MedicalRecordUpdatePayload
} from "../services/medicalRecordService.js";
import type { Address } from "../types/domain.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { auditContextFromRequest } from "../utils/requestAudit.js";
import { updateDoctorAvailabilitySchema } from "../validators/doctorValidators.js";
import { callNextQueuePatient, checkInAppointment, completeOperationalAppointment, createFollowUp, getDoctorQueue, markAppointmentNoShow } from "../services/operationsService.js";

const requireDoctorId = (doctorId?: string): string => {
  if (!doctorId) {
    throw new AppError("Not Authorized Login Again", 401);
  }

  return doctorId;
};

type HexStringable = { toHexString: () => string };

const hasToHexString = (value: unknown): value is HexStringable =>
  Boolean(
    value &&
      typeof value === "object" &&
      "toHexString" in value &&
      typeof value.toHexString === "function"
  );

const safeAuditId = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (hasToHexString(value)) {
    return value.toHexString();
  }

  return "";
};

export const appointmentsDoctor: RequestHandler = asyncHandler(async (req, res) => {
  const appointments = await listDoctorAppointments(
    requireDoctorId(req.authDoctorId),
    req.authOrganizationId
  );
  sendSuccess(res, 200, "Appointments loaded", { appointments }, { appointments });
});

export const appointmentCancel: RequestHandler = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body as { appointmentId: string };
  await cancelDoctorAppointment(
    requireDoctorId(req.authDoctorId),
    appointmentId,
    req.authOrganizationId
  );
  await writeAuditLog({
    eventType: "appointment.cancelled",
    ...auditContextFromRequest(req),
    target: { type: "appointment", id: appointmentId },
    metadata: { source: "doctor" }
  });
  sendSuccess(res, 200, "Appointment Cancelled");
});

export const appointmentComplete: RequestHandler = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body as { appointmentId: string };
  await completeOperationalAppointment(requireDoctorId(req.authDoctorId), appointmentId, req.authOrganizationId);
  await writeAuditLog({
    eventType: "appointment.status_changed",
    ...auditContextFromRequest(req),
    target: { type: "appointment", id: appointmentId },
    metadata: { status: "completed", source: "doctor" }
  });
  sendSuccess(res, 200, "Appointment Completed");
});

export const appointmentNoShow: RequestHandler = asyncHandler(async (req, res) => {
  const appointmentId = (req.body as { appointmentId: string }).appointmentId;
  await markAppointmentNoShow(requireDoctorId(req.authDoctorId), appointmentId, req.authOrganizationId);
  await writeAuditLog({ eventType: "appointment.no_show", ...auditContextFromRequest(req), target: { type: "appointment", id: appointmentId }, metadata: { source: "doctor" } });
  sendSuccess(res, 200, "Appointment marked as no-show");
});

export const appointmentCheckIn: RequestHandler = asyncHandler(async (req, res) => {
  const appointmentId = (req.body as { appointmentId: string }).appointmentId;
  const appointment = await checkInAppointment(requireDoctorId(req.authDoctorId), appointmentId, req.authOrganizationId);
  await writeAuditLog({ eventType: "appointment.checked_in", ...auditContextFromRequest(req), target: { type: "appointment", id: appointmentId }, metadata: { token: appointment.queueToken } });
  sendSuccess(res, 200, "Patient checked in", { appointment }, { appointment });
});

export const doctorQueue: RequestHandler = asyncHandler(async (req, res) => {
  const slotDate = req.query.slotDate as string;
  const queue = await getDoctorQueue(requireDoctorId(req.authDoctorId), slotDate, req.authOrganizationId);
  sendSuccess(res, 200, "Queue loaded", { queue }, { queue });
});

export const callNext: RequestHandler = asyncHandler(async (req, res) => {
  const slotDate = (req.body as { slotDate: string }).slotDate;
  const appointment = await callNextQueuePatient(requireDoctorId(req.authDoctorId), slotDate, req.authOrganizationId);
  await writeAuditLog({ eventType: "appointment.queue_called", ...auditContextFromRequest(req), target: { type: "appointment", id: String(appointment._id) }, metadata: { token: appointment.queueToken } });
  sendSuccess(res, 200, "Next patient called", { appointment }, { appointment });
});

export const operationalComplete: RequestHandler = asyncHandler(async (req, res) => {
  const appointmentId = req.params.appointmentId as string;
  await completeOperationalAppointment(requireDoctorId(req.authDoctorId), appointmentId, req.authOrganizationId);
  await writeAuditLog({ eventType: "appointment.status_changed", ...auditContextFromRequest(req), target: { type: "appointment", id: appointmentId }, metadata: { status: "completed", source: "operations" } });
  sendSuccess(res, 200, "Consultation completed");
});

export const recommendFollowUp: RequestHandler = asyncHandler(async (req, res) => {
  const appointmentId = req.params.appointmentId as string;
  const payload = req.body as { recommendedDate: string; reason: string };
  const followUp = await createFollowUp(requireDoctorId(req.authDoctorId), appointmentId, payload.recommendedDate, payload.reason, req.authOrganizationId);
  await writeAuditLog({ eventType: "appointment.follow_up.recommended", ...auditContextFromRequest(req), target: { type: "appointment", id: appointmentId }, metadata: { recommendedDate: followUp.recommendedDate } });
  sendSuccess(res, 200, "Follow-up recommendation saved", { followUp }, { followUp });
});

export const doctorList: RequestHandler = asyncHandler(async (_req, res) => {
  const doctors = await listPublicDoctors();
  sendSuccess(res, 200, "Doctors loaded", { doctors }, { doctors });
});

export const changeAvailablity: RequestHandler = asyncHandler(async (req, res) => {
  const docId = requireDoctorId(req.authDoctorId);
  await changeDoctorAvailability(docId, req.authOrganizationId);
  await writeAuditLog({
    eventType: "doctor.availability.updated",
    ...auditContextFromRequest(req),
    target: { type: "doctor", id: docId },
    metadata: { source: "legacy_toggle" }
  });
  sendSuccess(res, 200, "Availablity Changed");
});

export const availableSlots: RequestHandler = asyncHandler(async (req, res) => {
  const doctorId = req.params.doctorId as string;
  const { from, days } = req.query as unknown as { from?: string; days: number };
  const availability = await listDoctorAvailableSlots(doctorId, from, days);
  sendSuccess(res, 200, "Available slots loaded", { availability }, { availability });
});

export const ownAvailability: RequestHandler = asyncHandler(async (req, res) => {
  const availability = await getOwnDoctorAvailability(
    requireDoctorId(req.authDoctorId),
    req.authOrganizationId
  );
  sendSuccess(res, 200, "Availability loaded", { availability }, { availability });
});

export const updateOwnAvailability: RequestHandler = asyncHandler(async (req, res) => {
  const doctorId = requireDoctorId(req.authDoctorId);
  const payload = updateDoctorAvailabilitySchema.parse(req.body);
  const availability = await updateOwnDoctorAvailability(
    doctorId,
    payload,
    req.authOrganizationId
  );
  await writeAuditLog({
    eventType: "doctor.availability.updated",
    ...auditContextFromRequest(req),
    target: { type: "doctor", id: doctorId },
    metadata: {
      enabled: availability.enabled,
      timezone: availability.timezone,
      consultationDurationMinutes: availability.consultationDurationMinutes,
      activeDays: availability.weeklySchedule.filter((day) => day.slots.length > 0).length
    }
  });
  sendSuccess(res, 200, "Availability updated", { availability }, { availability });
});

export const updateClinicalNotes: RequestHandler = asyncHandler(async (req, res) => {
  const appointmentId = req.params.appointmentId as string;
  const notes = await updateDoctorClinicalNotes(
    requireDoctorId(req.authDoctorId),
    appointmentId,
    (req.body as { clinicalNotes: string }).clinicalNotes,
    req.authOrganizationId
  );
  await writeAuditLog({
    eventType: "appointment.clinical_notes.updated",
    ...auditContextFromRequest(req),
    target: { type: "appointment", id: appointmentId },
    metadata: { action: "updated" }
  });
  sendSuccess(res, 200, "Clinical notes saved", { notes }, { notes });
});

export const doctorProfile: RequestHandler = asyncHandler(async (req, res) => {
  const profileData = await getDoctorProfile(
    requireDoctorId(req.authDoctorId),
    req.authOrganizationId
  );
  sendSuccess(res, 200, "Profile loaded", { profileData }, { profileData });
});

export const updateDoctorProfile: RequestHandler = asyncHandler(async (req, res) => {
  const payload = req.body as {
    fees: number;
    address: Address;
    available: boolean;
    about?: string;
  };

  await updateDoctorProfileService(
    requireDoctorId(req.authDoctorId),
    payload,
    req.authOrganizationId
  );
  sendSuccess(res, 200, "Profile Updated");
});

export const doctorDashboard: RequestHandler = asyncHandler(async (req, res) => {
  const dashData = await getDoctorDashboard(
    requireDoctorId(req.authDoctorId),
    req.authOrganizationId
  );
  sendSuccess(res, 200, "Dashboard loaded", { dashData }, { dashData });
});

export const createAppointmentMedicalRecord: RequestHandler = asyncHandler(async (req, res) => {
  const appointmentId = req.params.appointmentId as string;
  const record = await createDoctorMedicalRecord({
    doctorId: requireDoctorId(req.authDoctorId),
    appointmentId,
    payload: req.body as MedicalRecordPayload,
    organizationId: req.authOrganizationId
  });
  await writeAuditLog({
    eventType: "medical_record.created",
    ...auditContextFromRequest(req),
    target: { type: "medical_record", id: safeAuditId(record._id) },
    metadata: { appointmentId, status: record.status }
  });
  sendSuccess(res, 201, "Medical record saved", { record }, { record });
});

export const doctorPatientMedicalRecords: RequestHandler = asyncHandler(async (req, res) => {
  const records = await listDoctorPatientRecords(
    requireDoctorId(req.authDoctorId),
    req.params.patientId as string,
    req.authOrganizationId
  );
  sendSuccess(res, 200, "Medical records loaded", { records }, { records });
});

export const updateAppointmentMedicalRecord: RequestHandler = asyncHandler(async (req, res) => {
  const recordId = req.params.recordId as string;
  const record = await updateDoctorMedicalRecord({
    doctorId: requireDoctorId(req.authDoctorId),
    recordId,
    payload: req.body as MedicalRecordUpdatePayload,
    organizationId: req.authOrganizationId
  });
  await writeAuditLog({
    eventType: record.status === "finalized" ? "medical_record.finalized" : "medical_record.updated",
    ...auditContextFromRequest(req),
    target: { type: "medical_record", id: recordId },
    metadata: { status: record.status }
  });
  sendSuccess(res, 200, "Medical record updated", { record }, { record });
});

export const finalizeAppointmentMedicalRecord: RequestHandler = asyncHandler(async (req, res) => {
  const recordId = req.params.recordId as string;
  const record = await finalizeDoctorMedicalRecord(
    requireDoctorId(req.authDoctorId),
    recordId,
    req.authOrganizationId
  );
  await writeAuditLog({
    eventType: "medical_record.finalized",
    ...auditContextFromRequest(req),
    target: { type: "medical_record", id: recordId },
    metadata: { patientVisible: record.patientVisible }
  });
  sendSuccess(res, 200, "Medical record finalized", { record }, { record });
});
