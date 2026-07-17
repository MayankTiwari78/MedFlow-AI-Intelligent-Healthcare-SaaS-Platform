import AppointmentModel, { type Appointment } from "../models/Appointment.js";
import DoctorModel, { type Doctor } from "../models/Doctor.js";
import UserModel, { type User } from "../models/User.js";
import type { Address } from "../types/domain.js";
import { AppError } from "../utils/AppError.js";
import { removeSensitiveFields } from "../utils/sanitize.js";
import { uploadImageToCloudinary } from "./uploadService.js";

type UserUpdatePayload = {
  name: string;
  phone: string;
  address: Address;
  dob: string;
  gender: string;
};

type BookAppointmentPayload = {
  docId: string;
  slotDate: string;
  slotTime: string;
};

const toStringId = (value: unknown): string => String(value);

const ensureUser = async (userId: string) => {
  const user = await UserModel.findById(userId).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

const ensureDoctor = async (docId: string) => {
  const doctor = await DoctorModel.findById(docId).select("-password");

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  return doctor;
};

const releaseDoctorSlot = async (
  docId: string,
  slotDate: string,
  slotTime: string
): Promise<void> => {
  const doctor = await DoctorModel.findById(docId);

  if (!doctor) {
    return;
  }

  const slotsBooked = { ...(doctor.slots_booked ?? {}) };
  slotsBooked[slotDate] = (slotsBooked[slotDate] ?? []).filter((time) => time !== slotTime);

  await DoctorModel.findByIdAndUpdate(docId, { slots_booked: slotsBooked });
};

export const getPatientProfile = async (userId: string): Promise<unknown> => {
  const user = await ensureUser(userId);
  return removeSensitiveFields(user);
};

export const updatePatientProfile = async (
  userId: string,
  payload: UserUpdatePayload,
  file?: Express.Multer.File
): Promise<void> => {
  const update: Partial<User> = {
    name: payload.name,
    phone: payload.phone,
    address: payload.address,
    dob: payload.dob,
    gender: payload.gender
  };

  if (file) {
    update.image = await uploadImageToCloudinary(file.path);
  }

  const updated = await UserModel.findByIdAndUpdate(userId, update, {
    new: true,
    runValidators: true
  });

  if (!updated) {
    throw new AppError("User not found", 404);
  }
};

export const bookPatientAppointment = async (
  userId: string,
  payload: BookAppointmentPayload
): Promise<void> => {
  const doctor = await ensureDoctor(payload.docId);

  if (!doctor.available) {
    throw new AppError("Doctor Not Available", 409);
  }

  const slotsBooked = { ...(doctor.slots_booked ?? {}) };
  const daySlots = [...(slotsBooked[payload.slotDate] ?? [])];

  if (daySlots.includes(payload.slotTime)) {
    throw new AppError("Slot Not Available", 409);
  }

  slotsBooked[payload.slotDate] = [...daySlots, payload.slotTime];

  const user = await ensureUser(userId);
  const userData = removeSensitiveFields(user) as User;
  const docData = removeSensitiveFields(doctor) as Partial<Doctor>;
  Reflect.deleteProperty(docData, "slots_booked");

  await new AppointmentModel({
    userId,
    docId: payload.docId,
    userData,
    docData,
    amount: doctor.fees,
    slotTime: payload.slotTime,
    slotDate: payload.slotDate,
    date: Date.now()
  }).save();

  await DoctorModel.findByIdAndUpdate(payload.docId, { slots_booked: slotsBooked });
};

export const cancelPatientAppointment = async (
  userId: string,
  appointmentId: string
): Promise<void> => {
  const appointment = await AppointmentModel.findById(appointmentId);

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  if (appointment.userId !== userId) {
    throw new AppError("Unauthorized action", 403);
  }

  await AppointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
  await releaseDoctorSlot(appointment.docId, appointment.slotDate, appointment.slotTime);
};

export const listPatientAppointments = async (userId: string): Promise<Appointment[]> =>
  AppointmentModel.find({ userId }).sort({ date: -1 });

export const ensurePatientAppointment = async (
  userId: string,
  appointmentId: string
): Promise<Appointment> => {
  const appointment = await AppointmentModel.findById(appointmentId);

  if (!appointment || appointment.cancelled) {
    throw new AppError("Appointment Cancelled or not found", 404);
  }

  if (appointment.userId !== userId) {
    throw new AppError("Unauthorized action", 403);
  }

  return appointment;
};

export const markAppointmentPaid = async (
  appointmentId: string,
  fields: Partial<Appointment> = {}
): Promise<void> => {
  await AppointmentModel.findByIdAndUpdate(appointmentId, {
    ...fields,
    payment: true
  });
};

export const markAppointmentPaymentReference = async (
  appointmentId: string,
  fields: Partial<Appointment>
): Promise<void> => {
  await AppointmentModel.findByIdAndUpdate(appointmentId, fields);
};

export const releaseAppointmentSlot = releaseDoctorSlot;

export const appointmentBelongsToDoctor = (appointment: Appointment, docId: string): boolean =>
  toStringId(appointment.docId) === docId;
