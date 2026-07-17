import { z } from "zod";

import { addressInputSchema, appointmentIdBodySchema, objectIdSchema } from "./common.js";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(20),
  address: addressInputSchema,
  dob: z.string().trim().min(1).max(30),
  gender: z.enum(["Male", "Female", "Not Selected"]).or(z.string().trim().min(1).max(30))
});

export const bookAppointmentSchema = z.object({
  docId: objectIdSchema,
  slotDate: z
    .string()
    .trim()
    .regex(/^\d{1,2}_\d{1,2}_\d{4}$/, "Invalid slot date"),
  slotTime: z.string().trim().min(1).max(20)
});

export const cancelAppointmentSchema = appointmentIdBodySchema;

export const paymentInitSchema = appointmentIdBodySchema;

export const verifyRazorpaySchema = z.object({
  razorpay_order_id: z.string().trim().min(1),
  razorpay_payment_id: z.string().trim().min(1),
  razorpay_signature: z.string().trim().min(1)
});

export const verifyStripeSchema = z.object({
  appointmentId: objectIdSchema,
  success: z.string().optional(),
  sessionId: z.string().trim().optional(),
  session_id: z.string().trim().optional()
});
