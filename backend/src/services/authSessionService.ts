import { env } from "../config/env.js";
import type { AccountType } from "../constants/auth.js";
import AuthSessionModel, { type AuthSessionDocument } from "../models/AuthSession.js";
import { AppError } from "../utils/AppError.js";
import { generateTokenId, hashSecret } from "../utils/authCrypto.js";
import { addDuration } from "../utils/duration.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type RefreshTokenPayload
} from "./tokenService.js";

export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionTokenBundle {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  sessionId: string;
}

export interface SessionAccountInput {
  accountId: string;
  accountType: AccountType;
  email?: string;
}

const refreshHash = (token: string): string => hashSecret(token, "refresh-token");

const describeDevice = (userAgent?: string): string | undefined =>
  userAgent ? userAgent.slice(0, 180) : undefined;

export const createSessionTokenBundle = async (
  account: SessionAccountInput,
  metadata: RequestMetadata
): Promise<SessionTokenBundle> => {
  const now = new Date();
  const sessionId = generateTokenId();
  const refreshTokenId = generateTokenId();
  const tokenFamilyId = generateTokenId();
  const refreshTokenExpiresAt = addDuration(now, env.REFRESH_TOKEN_EXPIRES_IN);
  const refreshToken = signRefreshToken({
    accountId: account.accountId,
    accountType: account.accountType,
    email: account.email,
    sessionId,
    tokenId: refreshTokenId,
    tokenFamilyId
  });

  await new AuthSessionModel({
    sessionId,
    accountId: account.accountId,
    accountType: account.accountType,
    refreshTokenHash: refreshHash(refreshToken),
    refreshTokenId,
    tokenFamilyId,
    createdAt: now,
    lastActiveAt: now,
    expiresAt: refreshTokenExpiresAt,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    device: describeDevice(metadata.userAgent)
  }).save();

  return {
    accessToken: signAccessToken(account),
    refreshToken,
    refreshTokenExpiresAt,
    sessionId
  };
};

export const rotateRefreshToken = async (
  rawRefreshToken: string,
  metadata: RequestMetadata
): Promise<{ payload: RefreshTokenPayload; bundle: SessionTokenBundle }> => {
  const payload = verifyRefreshToken(rawRefreshToken);
  const now = new Date();
  const nextRefreshTokenId = generateTokenId();
  const nextRefreshToken = signRefreshToken({
    accountId: payload.sub,
    accountType: payload.role,
    email: typeof payload.email === "string" ? payload.email : undefined,
    sessionId: payload.sessionId,
    tokenId: nextRefreshTokenId,
    tokenFamilyId: payload.tokenFamilyId
  });

  const updatedSession = await AuthSessionModel.findOneAndUpdate(
    {
      sessionId: payload.sessionId,
      refreshTokenHash: refreshHash(rawRefreshToken),
      refreshTokenId: payload.tokenId,
      tokenFamilyId: payload.tokenFamilyId,
      revokedAt: { $exists: false },
      expiresAt: { $gt: now }
    },
    {
      refreshTokenHash: refreshHash(nextRefreshToken),
      refreshTokenId: nextRefreshTokenId,
      lastActiveAt: now,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      device: describeDevice(metadata.userAgent)
    },
    { new: true }
  );

  if (!updatedSession) {
    await revokeFamilyForReuse(payload);
    throw new AppError("Invalid refresh token", 401);
  }

  return {
    payload,
    bundle: {
      accessToken: signAccessToken({
        accountId: payload.sub,
        accountType: payload.role,
        email: typeof payload.email === "string" ? payload.email : undefined
      }),
      refreshToken: nextRefreshToken,
      refreshTokenExpiresAt: updatedSession.expiresAt,
      sessionId: payload.sessionId
    }
  };
};

export const revokeSessionByRefreshToken = async (
  rawRefreshToken: string,
  reason: string
): Promise<void> => {
  const payload = verifyRefreshToken(rawRefreshToken);
  await AuthSessionModel.findOneAndUpdate(
    {
      sessionId: payload.sessionId,
      tokenFamilyId: payload.tokenFamilyId,
      revokedAt: { $exists: false }
    },
    {
      revokedAt: new Date(),
      revocationReason: reason
    }
  );
};

export const revokeAllSessionsForAccount = async (
  accountId: string,
  accountType: AccountType,
  reason: string
): Promise<void> => {
  await AuthSessionModel.updateMany(
    {
      accountId,
      accountType,
      revokedAt: { $exists: false }
    },
    {
      revokedAt: new Date(),
      revocationReason: reason
    }
  );
};

export const revokeFamilyForReuse = async (payload: RefreshTokenPayload): Promise<void> => {
  await AuthSessionModel.updateMany(
    {
      tokenFamilyId: payload.tokenFamilyId,
      revokedAt: { $exists: false }
    },
    {
      revokedAt: new Date(),
      revocationReason: "refresh-token-reuse-detected"
    }
  );
};

export const assertSessionIsUsable = (session: AuthSessionDocument): void => {
  if (session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    throw new AppError("Invalid refresh token", 401);
  }
};
