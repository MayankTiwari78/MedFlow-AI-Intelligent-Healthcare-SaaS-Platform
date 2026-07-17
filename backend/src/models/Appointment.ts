import mongoose, { type HydratedDocument, type Model } from "mongoose";

import type { DoctorSnapshot, UserProfileSnapshot } from "../types/domain.js";

export interface Appointment {
  userId: string;
  docId: string;
  slotDate: string;
  slotTime: string;
  userData: UserProfileSnapshot;
  docData: DoctorSnapshot;
  amount: number;
  date: number;
  cancelled: boolean;
  payment: boolean;
  isCompleted: boolean;
  stripeSessionId?: string;
  razorpayOrderId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AppointmentDocument = HydratedDocument<Appointment>;

const appointmentSchema = new mongoose.Schema<Appointment>(
  {
    userId: { type: String, required: true },
    docId: { type: String, required: true },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    userData: { type: mongoose.Schema.Types.Mixed, required: true },
    docData: { type: mongoose.Schema.Types.Mixed, required: true },
    amount: { type: Number, required: true },
    date: { type: Number, required: true },
    cancelled: { type: Boolean, default: false },
    payment: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    stripeSessionId: { type: String },
    razorpayOrderId: { type: String }
  },
  { timestamps: true }
);

appointmentSchema.index({ userId: 1 });
appointmentSchema.index({ docId: 1 });
appointmentSchema.index({ slotDate: 1, cancelled: 1, isCompleted: 1 });

const AppointmentModel =
  (mongoose.models.appointment as Model<Appointment> | undefined) ??
  mongoose.model<Appointment>("appointment", appointmentSchema);

export default AppointmentModel;
