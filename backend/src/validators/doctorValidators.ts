import { z } from "zod";

import { addressInputSchema, appointmentIdBodySchema } from "./common.js";

export const doctorActionAppointmentSchema = appointmentIdBodySchema;

export const updateDoctorProfileSchema = z.object({
  fees: z.coerce.number().nonnegative(),
  address: addressInputSchema,
  available: z.coerce.boolean(),
  about: z.string().trim().min(1).max(5000).optional()
});
