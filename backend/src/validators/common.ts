import { z } from "zod";

import { isValidObjectId } from "../utils/objectId.js";

export const objectIdSchema = z
  .string()
  .trim()
  .refine((value) => isValidObjectId(value), "Invalid ObjectId");

export const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z.string().min(8, "Please enter a strong password");

export const addressSchema = z.object({
  line1: z.string().trim().max(200).default(""),
  line2: z.string().trim().max(200).default("")
});

export const addressInputSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}, addressSchema);

export const appointmentIdBodySchema = z.object({
  appointmentId: objectIdSchema
});
