import mongoose, { type HydratedDocument, type Model } from "mongoose";

import type { Address } from "../types/domain.js";

export interface Doctor {
  name: string;
  email: string;
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
    date: { type: Number, required: true }
  },
  { minimize: false, timestamps: true }
);

const DoctorModel =
  (mongoose.models.doctor as Model<Doctor> | undefined) ??
  mongoose.model<Doctor>("doctor", doctorSchema);

export default DoctorModel;
