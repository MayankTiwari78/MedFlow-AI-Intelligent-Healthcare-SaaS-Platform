import bcrypt from "bcrypt";

import { env } from "../config/env.js";
import AppointmentModel from "../models/Appointment.js";
import DoctorModel from "../models/Doctor.js";
import UserModel from "../models/User.js";
import type { Address } from "../types/domain.js";
import { AppError } from "../utils/AppError.js";
import { normalizeEmail } from "../utils/authCrypto.js";
import { removeSensitiveFields } from "../utils/sanitize.js";
import { releaseAppointmentSlot } from "./userService.js";
import { uploadImageToCloudinary } from "./uploadService.js";

type AddDoctorPayload = {
  name: string;
  email: string;
  password: string;
  speciality: string;
  degree: string;
  experience: string;
  about: string;
  fees: number;
  address: Address;
};

export const listAllAppointments = async () => AppointmentModel.find({}).sort({ date: -1 });

export const cancelAdminAppointment = async (appointmentId: string): Promise<void> => {
  const appointment = await AppointmentModel.findById(appointmentId);

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  await AppointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
  await releaseAppointmentSlot(appointment.docId, appointment.slotDate, appointment.slotTime);
};

export const createDoctor = async (
  payload: AddDoctorPayload,
  file?: Express.Multer.File
): Promise<void> => {
  if (!file) {
    throw new AppError("Image Not Selected", 400);
  }

  const normalizedEmail = normalizeEmail(payload.email);
  const [existingDoctor, existingPatient] = await Promise.all([
    DoctorModel.findOne({ email: normalizedEmail }),
    UserModel.findOne({ email: normalizedEmail })
  ]);

  if (existingDoctor || existingPatient || normalizedEmail === normalizeEmail(env.ADMIN_EMAIL)) {
    throw new AppError("email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(payload.password, 12);
  const image = await uploadImageToCloudinary(file.path);

  await new DoctorModel({
    ...payload,
    email: normalizedEmail,
    normalizedEmail,
    image,
    password: hashedPassword,
    emailVerified: true,
    accountStatus: "ACTIVE",
    failedLoginAttempts: 0,
    authenticationProvider: "LOCAL",
    date: Date.now()
  }).save();
};

export const listAllDoctors = async (): Promise<unknown[]> => {
  const doctors = await DoctorModel.find({}).select("-password");
  return doctors.map((doctor) => removeSensitiveFields(doctor));
};

export const getAdminDashboard = async (): Promise<Record<string, unknown>> => {
  const [doctors, users, appointments] = await Promise.all([
    DoctorModel.find({}),
    UserModel.find({}),
    AppointmentModel.find({}).sort({ date: -1 })
  ]);

  return {
    doctors: doctors.length,
    appointments: appointments.length,
    patients: users.length,
    latestAppointments: appointments
  };
};
