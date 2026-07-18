import mongoose, { type HydratedDocument, type Model } from "mongoose";

import {
  ACCOUNT_STATUSES,
  AUTHENTICATION_PROVIDERS,
  type AccountStatus,
  type AuthenticationProvider
} from "../constants/auth.js";
import type { Address } from "../types/domain.js";

export interface Doctor {
  name: string;
  email: string;
  normalizedEmail: string;
  password: string;
  image: string;
  speciality: string;
  degree: string;
  experience: string;
  about: string;
  available: boolean;
  fees: number;
  slots_booked: Record<string, string[]>;
  address: Address;
  date: number;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  accountStatus: AccountStatus;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  passwordChangedAt?: Date;
  lastLoginAt?: Date;
  authenticationProvider: AuthenticationProvider;
  createdAt?: Date;
  updatedAt?: Date;
}

export type DoctorDocument = HydratedDocument<Doctor>;

const addressSchema = new mongoose.Schema<Address>(
  {
    line1: { type: String, required: true },
    line2: { type: String, required: true }
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema<Doctor>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    normalizedEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
    fees: { type: Number, required: true },
    slots_booked: { type: mongoose.Schema.Types.Mixed, default: {} },
    address: { type: addressSchema, required: true },
    date: { type: Number, required: true },
    emailVerified: { type: Boolean, default: true },
    emailVerifiedAt: { type: Date },
    accountStatus: {
      type: String,
      enum: ACCOUNT_STATUSES,
      default: "ACTIVE",
      index: true
    },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    passwordChangedAt: { type: Date },
    lastLoginAt: { type: Date },
    authenticationProvider: {
      type: String,
      enum: AUTHENTICATION_PROVIDERS,
      default: "LOCAL"
    }
  },
  { minimize: false, timestamps: true }
);

doctorSchema.pre("validate", function normalizeDoctorEmail() {
  if (this.email) {
    this.email = this.email.trim().toLowerCase();
    this.normalizedEmail = this.email;
  }
});

const DoctorModel =
  (mongoose.models.doctor as Model<Doctor> | undefined) ??
  mongoose.model<Doctor>("doctor", doctorSchema);

export default DoctorModel;
