import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().trim().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().trim().min(16, "JWT_SECRET must be at least 16 characters"),
  CLIENT_URL: z.string().trim().url().default("http://localhost:5173"),
  ADMIN_URL: z.string().trim().url().default("http://localhost:5174"),
  ADMIN_EMAIL: z
    .string()
    .trim()
    .email("ADMIN_EMAIL must be a valid email")
    .transform((value) => value.toLowerCase()),
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters"),
  CLOUDINARY_NAME: z.string().trim().min(1, "CLOUDINARY_NAME is required"),
  CLOUDINARY_API_KEY: z.string().trim().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_SECRET_KEY: z.string().trim().min(1, "CLOUDINARY_SECRET_KEY is required"),
  RAZORPAY_KEY_ID: z.string().trim().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z.string().trim().min(1, "RAZORPAY_KEY_SECRET is required"),
  STRIPE_SECRET_KEY: z.string().trim().min(1, "STRIPE_SECRET_KEY is required"),
  CURRENCY: z.string().trim().min(3).max(3).default("INR")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const messages = parsedEnv.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`
  );
  throw new Error(`Invalid backend environment configuration: ${messages.join("; ")}`);
}

export const env = {
  ...parsedEnv.data,
  isDevelopment: parsedEnv.data.NODE_ENV === "development",
  isTest: parsedEnv.data.NODE_ENV === "test",
  isProduction: parsedEnv.data.NODE_ENV === "production"
};

export type Env = typeof env;
