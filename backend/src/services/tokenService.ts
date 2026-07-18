import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

import { env } from "../config/env.js";
import type { AccountType } from "../constants/auth.js";
import { AppError } from "../utils/AppError.js";

export interface AccessTokenInput {
  accountId: string;
  accountType: AccountType;
  email?: string;
}

export interface RefreshTokenInput extends AccessTokenInput {
  sessionId: string;
  tokenId: string;
  tokenFamilyId: string;
}

export interface AccessTokenPayload extends JwtPayload {
  tokenType: "access";
  role: AccountType;
  id?: string;
  email?: string;
  sub: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  tokenType: "refresh";
  role: AccountType;
  sessionId: string;
  tokenId: string;
  tokenFamilyId: string;
  sub: string;
}

const signOptions = (expiresIn: string): SignOptions => ({
  expiresIn: expiresIn as SignOptions["expiresIn"],
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE
});

const requireObjectPayload = (payload: JwtPayload | string): JwtPayload => {
  if (typeof payload === "string") {
    throw new AppError("Not Authorized Login Again", 401);
  }

  return payload;
};

const isAccountType = (value: unknown): value is AccountType =>
  value === "patient" || value === "doctor" || value === "admin";

export const signAccessToken = ({ accountId, accountType, email }: AccessTokenInput): string => {
  const payload = {
    tokenType: "access",
    role: accountType,
    ...(accountType === "admin" ? { email } : { id: accountId })
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    ...signOptions(env.ACCESS_TOKEN_EXPIRES_IN),
    subject: accountId
  });
};

export const signRefreshToken = ({
  accountId,
  accountType,
  email,
  sessionId,
  tokenId,
  tokenFamilyId
}: RefreshTokenInput): string =>
  jwt.sign(
    {
      tokenType: "refresh",
      role: accountType,
      sessionId,
      tokenId,
      tokenFamilyId,
      ...(accountType === "admin" ? { email } : {})
    },
    env.JWT_REFRESH_SECRET,
    {
      ...signOptions(env.REFRESH_TOKEN_EXPIRES_IN),
      subject: accountId
    }
  );

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const payload = requireObjectPayload(
      jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE
      })
    );

    if (
      payload.tokenType !== "access" ||
      typeof payload.sub !== "string" ||
      !isAccountType(payload.role)
    ) {
      throw new AppError("Not Authorized Login Again", 401);
    }

    return payload as AccessTokenPayload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Not Authorized Login Again", 401);
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const payload = requireObjectPayload(
      jwt.verify(token, env.JWT_REFRESH_SECRET, {
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE
      })
    );

    if (
      payload.tokenType !== "refresh" ||
      typeof payload.sub !== "string" ||
      typeof payload.sessionId !== "string" ||
      typeof payload.tokenId !== "string" ||
      typeof payload.tokenFamilyId !== "string" ||
      !isAccountType(payload.role)
    ) {
      throw new AppError("Invalid refresh token", 401);
    }

    return payload as RefreshTokenPayload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Invalid refresh token", 401);
  }
};

export const verifyLegacyToken = (token: string): JwtPayload | string => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new AppError("Not Authorized Login Again", 401);
  }
};

export const signUserToken = (userId: string): string =>
  signAccessToken({ accountId: userId, accountType: "patient" });

export const signDoctorToken = (doctorId: string): string =>
  signAccessToken({ accountId: doctorId, accountType: "doctor" });

export const signAdminToken = (): string =>
  signAccessToken({ accountId: env.ADMIN_EMAIL, accountType: "admin", email: env.ADMIN_EMAIL });
