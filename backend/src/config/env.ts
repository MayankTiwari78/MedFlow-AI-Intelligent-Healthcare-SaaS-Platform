import "dotenv/config";
import { z } from "zod";

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  return value.trim().toLowerCase() === "true";
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().trim().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().trim().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_ACCESS_SECRET: z.string().trim().min(16).optional(),
  JWT_REFRESH_SECRET: z.string().trim().min(16).optional(),
  ACCESS_TOKEN_EXPIRES_IN: z.string().trim().min(1).default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().trim().min(1).default("30d"),
  JWT_ISSUER: z.string().trim().min(1).default("medflow-ai"),
  JWT_AUDIENCE: z.string().trim().min(1).default("medflow-ai-clients"),
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
  CURRENCY: z.string().trim().min(3).max(3).default("INR"),
  SMTP_HOST: z.string().trim().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: booleanFromEnv.default(false),
  SMTP_USER: z.string().trim().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().trim().default("MedFlow AI <no-reply@localhost>"),
  EMAIL_VERIFICATION_EXPIRES_IN: z.string().trim().min(1).default("24h"),
  PASSWORD_RESET_EXPIRES_IN: z.string().trim().min(1).default("1h"),
  OTP_EXPIRES_IN: z.string().trim().min(1).default("10m"),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  AUTH_LOCK_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  AUTH_LOCK_DURATION: z.string().trim().min(1).default("15m"),
  COOKIE_NAME: z.string().trim().min(1).default("medflow_refresh"),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const messages = parsedEnv.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`
  );
  throw new Error(`Invalid backend environment configuration: ${messages.join("; ")}`);
}

const productionMissingFields = [
  ["JWT_ACCESS_SECRET", parsedEnv.data.JWT_ACCESS_SECRET],
  ["JWT_REFRESH_SECRET", parsedEnv.data.JWT_REFRESH_SECRET],
  ["SMTP_HOST", parsedEnv.data.SMTP_HOST],
  ["SMTP_USER", parsedEnv.data.SMTP_USER],
  ["SMTP_PASSWORD", parsedEnv.data.SMTP_PASSWORD],
  ["EMAIL_FROM", parsedEnv.data.EMAIL_FROM]
].filter(([, value]) => !value);

if (parsedEnv.data.NODE_ENV === "production" && productionMissingFields.length > 0) {
  throw new Error(
    `Invalid backend environment configuration: production requires ${productionMissingFields
      .map(([key]) => key)
      .join(", ")}`
  );
}

if (
  parsedEnv.data.NODE_ENV === "production" &&
  parsedEnv.data.JWT_ACCESS_SECRET === parsedEnv.data.JWT_REFRESH_SECRET
) {
  throw new Error(
    "Invalid backend environment configuration: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ"
  );
}

export const env = {
  ...parsedEnv.data,
  JWT_ACCESS_SECRET: parsedEnv.data.JWT_ACCESS_SECRET ?? parsedEnv.data.JWT_SECRET,
  JWT_REFRESH_SECRET:
    parsedEnv.data.JWT_REFRESH_SECRET ?? `${parsedEnv.data.JWT_SECRET}-refresh-development-only`,
  SMTP_HOST: parsedEnv.data.SMTP_HOST ?? "",
  SMTP_USER: parsedEnv.data.SMTP_USER ?? "",
  SMTP_PASSWORD: parsedEnv.data.SMTP_PASSWORD ?? "",
  isDevelopment: parsedEnv.data.NODE_ENV === "development",
  isTest: parsedEnv.data.NODE_ENV === "test",
  isProduction: parsedEnv.data.NODE_ENV === "production"
};

export type Env = typeof env;
