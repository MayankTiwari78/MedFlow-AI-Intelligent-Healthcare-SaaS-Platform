import mongoose, { type Model } from "mongoose";

interface QueueCounter { organizationId?: string; docId: string; slotDate: string; nextToken: number }

const queueCounterSchema = new mongoose.Schema<QueueCounter>(
  { organizationId: { type: String }, docId: { type: String, required: true }, slotDate: { type: String, required: true }, nextToken: { type: Number, required: true, default: 0 } },
  { timestamps: true }
);
queueCounterSchema.index({ organizationId: 1, docId: 1, slotDate: 1 }, { unique: true });

export default ((mongoose.models.queue_counter as Model<QueueCounter> | undefined) ?? mongoose.model<QueueCounter>("queue_counter", queueCounterSchema));
