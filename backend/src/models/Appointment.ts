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
  /** Keeps a consultation slot reserved until the appointment reaches a terminal state. */
  activeSlot: boolean;
  status: "scheduled" | "checked_in" | "in_consultation" | "completed" | "cancelled" | "no_show";
  queueToken?: number;
  queueState?: "waiting" | "in_consultation" | "completed" | "skipped" | "cancelled";
  checkedInAt?: Date;
  consultationStartedAt?: Date;
  completedAt?: Date;
  followUp?: { recommendedDate: string; reason: string; scheduledAppointmentId?: string };
  rescheduledFromAppointmentId?: string;
  followUpSourceAppointmentId?: string;
  clinicalNotes?: string;
  clinicalNotesUpdatedAt?: Date;
  stripeSessionId?: string;
  razorpayOrderId?: string;
  organizationId?: string;
  demoSeedKey?: string;
  demoDataLabel?: string;
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
    activeSlot: { type: Boolean, default: true, index: true },
    status: {
      type: String,
      enum: ["scheduled", "checked_in", "in_consultation", "completed", "cancelled", "no_show"],
      default: "scheduled",
      index: true
    },
    clinicalNotes: { type: String, default: "", select: false },
    clinicalNotesUpdatedAt: { type: Date },
    queueToken: { type: Number },
    queueState: { type: String, enum: ["waiting", "in_consultation", "completed", "skipped", "cancelled"] },
    checkedInAt: { type: Date },
    consultationStartedAt: { type: Date },
    completedAt: { type: Date },
    followUp: {
      recommendedDate: { type: String },
      reason: { type: String },
      scheduledAppointmentId: { type: String }
    },
    rescheduledFromAppointmentId: { type: String },
    followUpSourceAppointmentId: { type: String },
    stripeSessionId: { type: String },
    razorpayOrderId: { type: String },
    organizationId: { type: String, index: true },
    demoSeedKey: { type: String, index: true },
    demoDataLabel: { type: String }
  },
  { timestamps: true }
);

appointmentSchema.index({ userId: 1 });
appointmentSchema.index({ docId: 1 });
appointmentSchema.index({ organizationId: 1, userId: 1 });
appointmentSchema.index({ organizationId: 1, docId: 1 });
appointmentSchema.index({ slotDate: 1, cancelled: 1, isCompleted: 1 });
appointmentSchema.index({ organizationId: 1, docId: 1, slotDate: 1, queueToken: 1 }, { unique: true, sparse: true });
appointmentSchema.index(
  { docId: 1, slotDate: 1, slotTime: 1 },
  { unique: true, partialFilterExpression: { activeSlot: true }, name: "active_appointment_slot" }
);
appointmentSchema.index(
  { docId: 1, slotDate: 1, slotTime: 1 },
  { unique: true, partialFilterExpression: { status: "scheduled" } }
);

const AppointmentModel =
  (mongoose.models.appointment as Model<Appointment> | undefined) ??
  mongoose.model<Appointment>("appointment", appointmentSchema);

export default AppointmentModel;
