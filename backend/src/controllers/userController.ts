import type { RequestHandler } from "express";

import {
  bookPatientAppointment,
  cancelPatientAppointment,
  getPatientProfile,
  listPatientAppointments,
  updatePatientProfile
} from "../services/userService.js";
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
  sendSuccess(res, 200, "Profile Updated");
});

export const bookAppointment: RequestHandler = asyncHandler(async (req, res) => {
  const payload = req.body as { docId: string; slotDate: string; slotTime: string };
  await bookPatientAppointment(requireUserId(req.authUserId), payload);
  sendSuccess(res, 201, "Appointment Booked");
});

export const cancelAppointment: RequestHandler = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body as { appointmentId: string };
  await cancelPatientAppointment(requireUserId(req.authUserId), appointmentId);
  sendSuccess(res, 200, "Appointment Cancelled");
});

export const listAppointment: RequestHandler = asyncHandler(async (req, res) => {
  const appointments = await listPatientAppointments(requireUserId(req.authUserId));
  sendSuccess(res, 200, "Appointments loaded", { appointments }, { appointments });
});

export const paymentRazorpay: RequestHandler = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body as { appointmentId: string };
  const order = await createRazorpayOrder(requireUserId(req.authUserId), appointmentId);
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
    razorpay_signature
  );
  sendSuccess(res, 200, "Payment Successful");
});

export const paymentStripe: RequestHandler = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body as { appointmentId: string };
  const sessionUrl = await createStripeCheckoutSession(
    requireUserId(req.authUserId),
    appointmentId,
    req.get("origin")
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

  await verifyStripePayment(requireUserId(req.authUserId), appointmentId, sessionId ?? session_id);
  sendSuccess(res, 200, "Payment Successful");
});
