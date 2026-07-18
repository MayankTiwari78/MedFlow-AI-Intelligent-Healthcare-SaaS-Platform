import type { Request, RequestHandler } from "express";
import type { JwtPayload } from "jsonwebtoken";

import { env } from "../config/env.js";
import type { AccountType } from "../constants/auth.js";
import {
  assertAccessAllowed,
  findAccountById,
  type AuthAccount
} from "../services/accountService.js";
import {
  verifyAccessToken,
  verifyLegacyToken,
  type AccessTokenPayload
} from "../services/tokenService.js";
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

const getTokenFromHeaders = (req: Request, legacyHeader?: string): string | undefined =>
  getBearerToken(req) ?? (legacyHeader ? req.get(legacyHeader) : undefined);

const isLegacyJwtPayload = (payload: JwtPayload | string): payload is JwtPayload =>
  typeof payload !== "string";

const verifyRequestToken = (token: string): AccessTokenPayload | JwtPayload | string => {
  try {
    return verifyAccessToken(token);
  } catch {
    return verifyLegacyToken(token);
  }
};

const getPayloadId = (payload: AccessTokenPayload | JwtPayload | string): string | undefined => {
  if (typeof payload === "string") {
    return undefined;
  }

  if (typeof payload.sub === "string" && payload.tokenType === "access") {
    return payload.sub;
  }

  return typeof payload.id === "string" ? payload.id : undefined;
};

const getPayloadRole = (
  payload: AccessTokenPayload | JwtPayload | string
): AccountType | undefined => {
  if (typeof payload === "string") {
    return undefined;
  }

  const role: unknown = payload.role;

  if (role === "patient" || role === "doctor" || role === "admin") {
    return role;
  }

  return undefined;
};

const assertTokenNotInvalidatedByPasswordChange = (
  payload: AccessTokenPayload | JwtPayload,
  account: AuthAccount
): void => {
  if (!account.passwordChangedAt || typeof payload.iat !== "number") {
    return;
  }

  if (payload.iat * 1000 < account.passwordChangedAt.getTime()) {
    throw new AppError("Not Authorized Login Again", 401);
  }
};

const attachRequestAccount = (
  req: Request,
  payload: AccessTokenPayload | JwtPayload | string,
  accountType: AccountType,
  accountId: string
): void => {
  req.auth = payload;
  req.authAccountType = accountType;
  req.authAccountId = accountId;

  if (accountType === "patient") {
    req.authUserId = accountId;
  } else if (accountType === "doctor") {
    req.authDoctorId = accountId;
  } else {
    req.authAdminEmail = env.ADMIN_EMAIL;
  }
};

const authenticate = async (
  req: Request,
  expectedAccountType?: AccountType,
  legacyHeader?: string
): Promise<void> => {
  const token = getTokenFromHeaders(req, legacyHeader);

  if (!token) {
    throw new AppError("Not Authorized Login Again", 401);
  }

  const payload = verifyRequestToken(token);

  if (typeof payload === "string") {
    const legacyPayload = `${env.ADMIN_EMAIL}${env.ADMIN_PASSWORD}`;

    if (expectedAccountType !== "admin" || payload !== legacyPayload) {
      throw new AppError("Not Authorized Login Again", 401);
    }

    attachRequestAccount(req, payload, "admin", env.ADMIN_EMAIL);
    return;
  }

  const accountType = getPayloadRole(payload);
  const accountId = getPayloadId(payload);

  if (!accountType || (expectedAccountType && accountType !== expectedAccountType)) {
    throw new AppError("Not Authorized Login Again", 401);
  }

  if (accountType === "admin") {
    if (
      !isLegacyJwtPayload(payload) ||
      payload.email !== env.ADMIN_EMAIL ||
      (expectedAccountType && expectedAccountType !== "admin")
    ) {
      throw new AppError("Not Authorized Login Again", 401);
    }

    attachRequestAccount(req, payload, "admin", env.ADMIN_EMAIL);
    return;
  }

  if (!accountId) {
    throw new AppError("Not Authorized Login Again", 401);
  }

  const account = await findAccountById(accountType, accountId);

  if (!account) {
    throw new AppError("Not Authorized Login Again", 401);
  }

  assertAccessAllowed(account);
  assertTokenNotInvalidatedByPasswordChange(payload, account);
  attachRequestAccount(req, payload, accountType, accountId);
};

export const authUser: RequestHandler = async (req, _res, next) => {
  try {
    await authenticate(req, "patient", "token");
    next();
  } catch (error) {
    next(error);
  }
};

export const authDoctor: RequestHandler = async (req, _res, next) => {
  try {
    await authenticate(req, "doctor", "dtoken");
    next();
  } catch (error) {
    next(error);
  }
};

export const authAdmin: RequestHandler = async (req, _res, next) => {
  try {
    await authenticate(req, "admin", "atoken");
    next();
  } catch (error) {
    next(error);
  }
};

export const authAny: RequestHandler = async (req, _res, next) => {
  try {
    await authenticate(req);
    next();
  } catch (error) {
    next(error);
  }
};
