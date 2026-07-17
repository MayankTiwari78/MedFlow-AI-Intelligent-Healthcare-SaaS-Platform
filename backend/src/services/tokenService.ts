import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env.js";
import { JWT_EXPIRES_IN } from "../constants/defaults.js";

const signJwt = (payload: string | object): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const signUserToken = (userId: string): string => signJwt({ id: userId, role: "patient" });

export const signDoctorToken = (doctorId: string): string =>
  signJwt({ id: doctorId, role: "doctor" });

export const signAdminToken = (): string => signJwt({ role: "admin", email: env.ADMIN_EMAIL });
