import AppointmentModel, { type Appointment, type AppointmentDocument } from "../models/Appointment.js";
import QueueCounterModel from "../models/QueueCounter.js";
import ReminderModel from "../models/Reminder.js";
import { AppError } from "../utils/AppError.js";
import { getAppointmentStatus, isFutureSlot, localSlotDateTime, sanitizeAppointmentForPatient } from "../utils/appointments.js";
import { appointmentBelongsToDoctor, bookPatientAppointment, releaseAppointmentSlot } from "./userService.js";

type LifecycleStatus = Appointment["status"];
const transitions: Record<LifecycleStatus, readonly LifecycleStatus[]> = {
  scheduled: ["checked_in", "cancelled", "no_show"], checked_in: ["in_consultation", "cancelled"],
  in_consultation: ["completed", "cancelled"], completed: [], cancelled: [], no_show: []
};
/** Operational records are never allowed to cross an authenticated tenant boundary. */
const tenantFilter = (organizationId?: string) => organizationId ? { organizationId } : {};
const assertTenant = (appointment: Appointment, organizationId?: string) => {
  if (organizationId && appointment.organizationId && appointment.organizationId !== organizationId) throw new AppError("Appointment not found", 404);
};
const transitionUpdate = (status: LifecycleStatus) => ({
  status,
  cancelled: status === "cancelled",
  isCompleted: status === "completed",
  activeSlot: !["completed", "cancelled", "no_show"].includes(status)
});

export const transitionAppointment = async (appointment: AppointmentDocument, target: LifecycleStatus): Promise<AppointmentDocument> => {
  const current = getAppointmentStatus(appointment);
  if (!transitions[current].includes(target)) throw new AppError(`Cannot change an ${current} appointment to ${target}`, 409);
  const now = new Date();
  const update: Record<string, unknown> = transitionUpdate(target);
  if (target === "checked_in") { update.checkedInAt = now; update.queueState = "waiting"; }
  if (target === "in_consultation") { update.consultationStartedAt = now; update.queueState = "in_consultation"; }
  if (target === "completed") { update.completedAt = now; update.queueState = "completed"; }
  if (target === "cancelled") update.queueState = "cancelled";
  const updated = await AppointmentModel.findOneAndUpdate({ _id: appointment._id, status: current }, update, { new: true });
  if (!updated) throw new AppError("Appointment changed by another operation; refresh and try again", 409);
  if (target === "cancelled") await releaseAppointmentSlot(appointment.docId, appointment.slotDate, appointment.slotTime);
  return updated;
};

export const checkInAppointment = async (doctorId: string, appointmentId: string, organizationId?: string) => {
  const appointment = await AppointmentModel.findById(appointmentId);
  if (!appointment || !appointmentBelongsToDoctor(appointment, doctorId)) throw new AppError("Appointment not found", 404);
  assertTenant(appointment, organizationId);
  if (getAppointmentStatus(appointment) !== "scheduled") throw new AppError("Only scheduled appointments can be checked in", 409);
  const counter = await QueueCounterModel.findOneAndUpdate(
    { organizationId: appointment.organizationId, docId: appointment.docId, slotDate: appointment.slotDate },
    { $inc: { nextToken: 1 }, $setOnInsert: { organizationId: appointment.organizationId, docId: appointment.docId, slotDate: appointment.slotDate } },
    { new: true, upsert: true }
  );
  const token = counter.nextToken;
  const updated = await AppointmentModel.findOneAndUpdate(
    { _id: appointmentId, status: "scheduled", queueToken: { $exists: false } },
    { ...transitionUpdate("checked_in"), queueToken: token, queueState: "waiting", checkedInAt: new Date() }, { new: true }
  );
  if (!updated) throw new AppError("Appointment changed by another operation; refresh and try again", 409);
  return updated;
};

export const getDoctorQueue = async (doctorId: string, slotDate: string, organizationId?: string) =>
  AppointmentModel.find({ docId: doctorId, slotDate, queueToken: { $exists: true }, ...tenantFilter(organizationId) }).sort({ queueToken: 1 });

export const callNextQueuePatient = async (doctorId: string, slotDate: string, organizationId?: string) => {
  const next = await AppointmentModel.findOneAndUpdate(
    { docId: doctorId, slotDate, status: "checked_in", queueState: "waiting", ...tenantFilter(organizationId) },
    { ...transitionUpdate("in_consultation"), queueState: "in_consultation", consultationStartedAt: new Date() },
    { new: true, sort: { queueToken: 1 } }
  );
  if (!next) throw new AppError("No waiting patient in this queue", 409);
  return next;
};

export const completeOperationalAppointment = async (doctorId: string, appointmentId: string, organizationId?: string) => {
  const appointment = await AppointmentModel.findById(appointmentId);
  if (!appointment || !appointmentBelongsToDoctor(appointment, doctorId)) throw new AppError("Appointment not found", 404);
  assertTenant(appointment, organizationId);
  return transitionAppointment(appointment, "completed");
};

export const markAppointmentNoShow = async (doctorId: string, appointmentId: string, organizationId?: string) => {
  const appointment = await AppointmentModel.findById(appointmentId);
  if (!appointment || !appointmentBelongsToDoctor(appointment, doctorId)) throw new AppError("Appointment not found", 404);
  assertTenant(appointment, organizationId);
  return transitionAppointment(appointment, "no_show");
};

export const createFollowUp = async (doctorId: string, appointmentId: string, recommendedDate: string, reason: string, organizationId?: string) => {
  const appointment = await AppointmentModel.findById(appointmentId);
  if (!appointment || !appointmentBelongsToDoctor(appointment, doctorId)) throw new AppError("Appointment not found", 404);
  assertTenant(appointment, organizationId);
  if (getAppointmentStatus(appointment) !== "completed") throw new AppError("Follow-ups can only be recommended after a completed appointment", 409);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(recommendedDate) || new Date(`${recommendedDate}T23:59:59`) < new Date()) throw new AppError("Choose a future follow-up date", 400);
  const followUp = { recommendedDate, reason };
  await AppointmentModel.findByIdAndUpdate(appointmentId, { followUp });
  await ReminderModel.findOneAndUpdate(
    { userId: appointment.userId, appointmentId, type: "follow_up_due" },
    { userId: appointment.userId, organizationId: appointment.organizationId, appointmentId, type: "follow_up_due", dueAt: new Date(`${recommendedDate}T09:00:00`), title: "Follow-up recommended", body: `Your clinician recommended a follow-up on ${recommendedDate}.` },
    { upsert: true, new: true }
  );
  return followUp;
};

export const reschedulePatientAppointment = async (userId: string, appointmentId: string, slotDate: string, slotTime: string, organizationId?: string) => {
  const current = await AppointmentModel.findById(appointmentId);
  if (!current || current.userId !== userId) throw new AppError("Appointment not found", 404);
  assertTenant(current, organizationId);
  if (getAppointmentStatus(current) !== "scheduled" || !isFutureSlot(current.slotDate, current.slotTime)) throw new AppError("Only future scheduled appointments can be rescheduled", 409);
  if (current.slotDate === slotDate && current.slotTime === slotTime) throw new AppError("Choose a different appointment time", 400);
  const replacement = await bookPatientAppointment(userId, { docId: current.docId, slotDate, slotTime }, organizationId);
  const cancelled = await AppointmentModel.findOneAndUpdate(
    { _id: appointmentId, userId, status: "scheduled", ...tenantFilter(organizationId) },
    { ...transitionUpdate("cancelled"), queueState: "cancelled" },
    { new: true }
  );
  if (!cancelled) {
    await AppointmentModel.findByIdAndUpdate(replacement.appointmentId, { ...transitionUpdate("cancelled"), queueState: "cancelled" });
    await releaseAppointmentSlot(current.docId, replacement.slotDate, replacement.slotTime);
    throw new AppError("Appointment changed while rescheduling; no replacement was kept", 409);
  }
  await AppointmentModel.findByIdAndUpdate(replacement.appointmentId, { rescheduledFromAppointmentId: appointmentId });
  await releaseAppointmentSlot(current.docId, current.slotDate, current.slotTime);
  return replacement;
};

export const bookFollowUpAppointment = async (
  userId: string,
  sourceAppointmentId: string,
  slotDate: string,
  slotTime: string,
  organizationId?: string
) => {
  const source = await AppointmentModel.findOne({
    _id: sourceAppointmentId,
    userId,
    status: "completed",
    ...tenantFilter(organizationId)
  });
  if (!source || !source.followUp?.recommendedDate) throw new AppError("Follow-up recommendation not found", 404);
  if (source.followUp.scheduledAppointmentId) throw new AppError("This follow-up has already been scheduled", 409);
  const booking = await bookPatientAppointment(userId, { docId: source.docId, slotDate, slotTime }, organizationId);
  const linked = await AppointmentModel.findOneAndUpdate(
    { _id: sourceAppointmentId, userId, status: "completed", "followUp.scheduledAppointmentId": { $exists: false }, ...tenantFilter(organizationId) },
    { "followUp.scheduledAppointmentId": booking.appointmentId },
    { new: true }
  );
  if (!linked) {
    await AppointmentModel.findByIdAndUpdate(booking.appointmentId, { ...transitionUpdate("cancelled"), queueState: "cancelled" });
    await releaseAppointmentSlot(source.docId, booking.slotDate, booking.slotTime);
    throw new AppError("Follow-up changed while booking; no appointment was kept", 409);
  }
  await AppointmentModel.findByIdAndUpdate(booking.appointmentId, { followUpSourceAppointmentId: sourceAppointmentId });
  return booking;
};

export const ensureAppointmentReminder = async (appointmentId: string) => {
  const appointment = await AppointmentModel.findById(appointmentId);
  if (!appointment) return;
  const dueAt = new Date(localSlotDateTime(appointment.slotDate, appointment.slotTime).getTime() - 24 * 60 * 60 * 1000);
  if (dueAt <= new Date()) return;
  await ReminderModel.findOneAndUpdate({ userId: appointment.userId, appointmentId, type: "appointment_upcoming" }, { userId: appointment.userId, organizationId: appointment.organizationId, appointmentId, type: "appointment_upcoming", dueAt, title: "Upcoming appointment", body: `You have an appointment on ${appointment.slotDate} at ${appointment.slotTime}.` }, { upsert: true });
};

export const listPatientReminders = async (userId: string, organizationId?: string) => ReminderModel.find({ userId, ...tenantFilter(organizationId) }).sort({ readAt: 1, dueAt: 1 });
export const markReminderRead = async (userId: string, reminderId: string, organizationId?: string) => {
  const reminder = await ReminderModel.findOneAndUpdate({ _id: reminderId, userId, ...tenantFilter(organizationId) }, { readAt: new Date() }, { new: true });
  if (!reminder) throw new AppError("Reminder not found", 404); return reminder;
};
export const patientQueueStatus = async (userId: string, appointmentId: string, organizationId?: string) => {
  const appointment = await AppointmentModel.findOne({ _id: appointmentId, userId, ...tenantFilter(organizationId) });
  if (!appointment) throw new AppError("Appointment not found", 404);
  if (!appointment.queueToken) return { appointment: sanitizeAppointmentForPatient(appointment), position: null };
  const position = await AppointmentModel.countDocuments({ docId: appointment.docId, slotDate: appointment.slotDate, status: "checked_in", queueState: "waiting", queueToken: { $lt: appointment.queueToken }, ...tenantFilter(organizationId) });
  return { appointment: sanitizeAppointmentForPatient(appointment), position: position + 1 };
};
