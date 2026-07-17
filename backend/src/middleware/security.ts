import cors from "cors";
import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const allowedOrigins = new Set([env.CLIENT_URL, env.ADMIN_URL]);

export const helmetMiddleware = helmet();

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new AppError("Origin is not allowed by CORS", 403));
  },
  credentials: true
});

const disabledRateLimiter: RequestHandler = (_req, _res, next) => next();

export const generalRateLimiter = env.isTest
  ? disabledRateLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: "Too many requests, please try again later",
        errors: []
      }
    });

export const authRateLimiter = env.isTest
  ? disabledRateLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 25,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: "Too many authentication attempts, please try again later",
        errors: []
      }
    });
