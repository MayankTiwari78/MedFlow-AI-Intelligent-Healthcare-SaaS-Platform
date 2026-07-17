import type { Request, RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const getBearerToken = (req: Request): string | undefined => {
  const authorization = req.get("authorization");
  if (!authorization) {
    return undefined;
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return undefined;
  }

  return token;
};

const getTokenFromHeaders = (req: Request, legacyHeader: string): string | undefined =>
  getBearerToken(req) ?? req.get(legacyHeader);

const verifyToken = (token: string): JwtPayload | string => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new AppError("Not Authorized Login Again", 401);
  }
};

const getPayloadId = (payload: JwtPayload | string): string | undefined => {
  if (typeof payload === "string") {
    return undefined;
  }

  return typeof payload.id === "string" ? payload.id : undefined;
};

export const authUser: RequestHandler = (req, _res, next) => {
  const token = getTokenFromHeaders(req, "token");

  if (!token) {
    throw new AppError("Not Authorized Login Again", 401);
  }

  const payload = verifyToken(token);
  const userId = getPayloadId(payload);

  if (!userId) {
    throw new AppError("Not Authorized Login Again", 401);
  }

  req.auth = payload;
  req.authUserId = userId;
  next();
};

export const authDoctor: RequestHandler = (req, _res, next) => {
  const token = getTokenFromHeaders(req, "dtoken");

  if (!token) {
    throw new AppError("Not Authorized Login Again", 401);
  }

  const payload = verifyToken(token);
  const doctorId = getPayloadId(payload);

  if (!doctorId) {
    throw new AppError("Not Authorized Login Again", 401);
  }

  req.auth = payload;
  req.authDoctorId = doctorId;
  next();
};

export const authAdmin: RequestHandler = (req, _res, next) => {
  const token = getTokenFromHeaders(req, "atoken");

  if (!token) {
    throw new AppError("Not Authorized Login Again", 401);
  }

  const payload = verifyToken(token);
  const legacyPayload = `${env.ADMIN_EMAIL}${env.ADMIN_PASSWORD}`;

  if (typeof payload === "string") {
    if (payload !== legacyPayload) {
      throw new AppError("Not Authorized Login Again", 401);
    }

    req.auth = payload;
    req.authAdminEmail = env.ADMIN_EMAIL;
    next();
    return;
  }

  if (payload.role !== "admin" || payload.email !== env.ADMIN_EMAIL) {
    throw new AppError("Not Authorized Login Again", 401);
  }

  req.auth = payload;
  req.authAdminEmail = env.ADMIN_EMAIL;
  next();
};
