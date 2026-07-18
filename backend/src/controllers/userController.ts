import type { RequestHandler } from "express";

import {
  bookPatientAppointment,
  cancelPatientAppointment,
  getPatientHealthProfile,
  getPatientProfile,
  listPatientAppointments,
  updatePatientHealthProfile,
  updatePatientProfile
} from "../services/userService.js";
import { writeAuditLog } from "../services/auditService.js";
import {
  createRazorpayOrder,
  createStripeCheckoutSession,
  verifyRazorpayPayment,
  verifyStripePayment
} from "../services/paymentService.js";
import type { Address } from "../types/domain.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { auditContextFromRequest } from "../utils/requestAudit.js";
import { updateHealthProfileSchema } from "../validators/userValidators.js";

const requireUserId = (userId?: string): string => {
  if (!userId) {
    throw new AppError("Not Authorized Login Again", 401);
  }

  return userId;
};

export const getProfile: RequestHandler = asyncHandler(async (req, res) => {
  const userData = await getPatientProfile(requireUserId(req.authUserId));
  sendSuccess(res, 200, "Profile loaded", { userData }, { userData });
});

export const updateProfile: RequestHandler = asyncHandler(async (req, res) => {
  const payload = req.body as {
    name: string;
    phone: string;
    address: Address;
    dob: string;
    gender: string;
  };

  await updatePatientProfile(requireUserId(req.authUserId), payload, req.file);
  await writeAuditLog({
    eventType: "patient.profile.updated",
    ...auditContextFromRequest(req),
    target: { type: "patient", id: requireUserId(req.authUserId) }
  });
  sendSuccess(res, 200, "Profile Updated");
});

export const getHealthProfile: RequestHandler = asyncHandler(async (req, res) => {
  const healthProfile = await getPatientHealthProfile(requireUserId(req.authUserId));
  sendSuccess(res, 200, "Health profile loaded", { healthProfile }, { healthProfile });
});

export const updateHealthProfile: RequestHandler = asyncHandler(async (req, res) => {
  const userId = requireUserId(req.authUserId);
  const payload = updateHealthProfileSchema.parse(req.body);
  const healthProfile = await updatePatientHealthProfile(userId, payload);
  await writeAuditLog({
    eventType: "patient.health_profile.updated",
    ...auditContextFromRequest(req),
    target: { type: "patient", id: userId },
    metadata: { sections: ["identity", "health", "emergency", "insurance"] }
  });
  sendSuccess(res, 200, "Health profile updated", { healthProfile }, { healthProfile });
});

export const bookAppointment: RequestHandler = asyncHandler(async (req, res) => {
  const payload = req.body as { docId: string; slotDate: string; slotTime: string };
  const booking = await bookPatientAppointment(
    requireUserId(req.authUserId),
    payload,
    req.authOrganizationId
  );
  await writeAuditLog({
    eventType: "appointment.booked",
    ...auditContextFromRequest(req),
    target: { type: "appointment", id: booking.appointmentId },
    metadata: { doctorId: payload.docId, slotDate: booking.slotDate, slotTime: booking.slotTime }
  });
  sendSuccess(res, 201, "Appointment Booked", { appointment: booking }, { appointment: booking });
});

export const cancelAppointment: RequestHandler = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body as { appointmentId: string };
  await cancelPatientAppointment(
    requireUserId(req.authUserId),
    appointmentId,
    req.authOrganizationId
  );
  await writeAuditLog({
    eventType: "appointment.cancelled",
    ...auditContextFromRequest(req),
    target: { type: "appointment", id: appointmentId },
    metadata: { source: "patient" }
  });
  sendSuccess(res, 200, "Appointment Cancelled");
});

export const listAppointment: RequestHandler = asyncHandler(async (req, res) => {
  const appointments = await listPatientAppointments(
    requireUserId(req.authUserId),
    req.authOrganizationId
  );
  sendSuccess(res, 200, "Appointments loaded", { appointments }, { appointments });
});

export const paymentRazorpay: RequestHandler = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body as { appointmentId: string };
  const order = await createRazorpayOrder(
    requireUserId(req.authUserId),
    appointmentId,
    req.authOrganizationId
  );
  sendSuccess(res, 200, "Razorpay order created", { order }, { order });
});

export const verifyRazorpay: RequestHandler = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  };

  await verifyRazorpayPayment(
    requireUserId(req.authUserId),
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    req.authOrganizationId
  );
  sendSuccess(res, 200, "Payment Successful");
});

export const paymentStripe: RequestHandler = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body as { appointmentId: string };
  const sessionUrl = await createStripeCheckoutSession(
    requireUserId(req.authUserId),
    appointmentId,
    req.get("origin"),
    req.authOrganizationId
  );

  sendSuccess(
    res,
    200,
    "Stripe checkout session created",
    { session_url: sessionUrl },
    { session_url: sessionUrl }
  );
});

export const verifyStripe: RequestHandler = asyncHandler(async (req, res) => {
  const { appointmentId, sessionId, session_id } = req.body as {
    appointmentId: string;
    sessionId?: string;
    session_id?: string;
  };

  await verifyStripePayment(
    requireUserId(req.authUserId),
    appointmentId,
    sessionId ?? session_id,
    req.authOrganizationId
  );
  sendSuccess(res, 200, "Payment Successful");
});
