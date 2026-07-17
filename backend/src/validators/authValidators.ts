import { z } from "zod";

import { emailSchema, passwordSchema } from "./common.js";

export const registerUserSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: emailSchema,
  password: passwordSchema
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required")
});

export const adminLoginSchema = loginSchema;
