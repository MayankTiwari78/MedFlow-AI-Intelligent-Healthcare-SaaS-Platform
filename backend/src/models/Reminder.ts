import mongoose, { type HydratedDocument, type Model } from "mongoose";

export interface Reminder { userId: string; organizationId?: string; appointmentId?: string; type: "appointment_upcoming" | "follow_up_due"; dueAt: Date; title: string; body: string; readAt?: Date; createdAt?: Date; updatedAt?: Date }
export type ReminderDocument = HydratedDocument<Reminder>;
const reminderSchema = new mongoose.Schema<Reminder>({
  userId: { type: String, required: true, index: true }, organizationId: { type: String, index: true }, appointmentId: { type: String, index: true },
  type: { type: String, enum: ["appointment_upcoming", "follow_up_due"], required: true }, dueAt: { type: Date, required: true, index: true },
  title: { type: String, required: true, maxlength: 160 }, body: { type: String, required: true, maxlength: 500 }, readAt: { type: Date }
}, { timestamps: true });
reminderSchema.index({ userId: 1, appointmentId: 1, type: 1 }, { unique: true, sparse: true });
export default ((mongoose.models.reminder as Model<Reminder> | undefined) ?? mongoose.model<Reminder>("reminder", reminderSchema));
