import type { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload | string;
      authUserId?: string;
      authDoctorId?: string;
      authAdminEmail?: string;
      authAccountId?: string;
      authAccountType?: "patient" | "doctor" | "admin";
    }
  }
}

export {};
