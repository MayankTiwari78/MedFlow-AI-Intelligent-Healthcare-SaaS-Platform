import type { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload | string;
      authUserId?: string;
      authDoctorId?: string;
      authAdminEmail?: string;
    }
  }
}

export {};
