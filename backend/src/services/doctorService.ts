import AppointmentModel, { type Appointment } from "../models/Appointment.js";
import DoctorModel, { type Doctor } from "../models/Doctor.js";
import type { Address } from "../types/domain.js";
import { AppError } from "../utils/AppError.js";
import { removeSensitiveFields } from "../utils/sanitize.js";
import { appointmentBelongsToDoctor } from "./userService.js";

type DoctorProfileUpdate = {
  fees: number;
  address: Address;
  available: boolean;
  about?: string;
};

export const listPublicDoctors = async (): Promise<unknown[]> => {
  const doctors = await DoctorModel.find({}).select("-password -email");
  return doctors.map((doctor) => removeSensitiveFields(doctor));
};

export const listDoctorAppointments = async (docId: string): Promise<Appointment[]> =>
  AppointmentModel.find({ docId }).sort({ date: -1 });

export const cancelDoctorAppointment = async (
  docId: string,
  appointmentId: string
): Promise<void> => {
  const appointment = await AppointmentModel.findById(appointmentId);

  if (!appointment || !appointmentBelongsToDoctor(appointment, docId)) {
    throw new AppError("Unauthorized action", 403);
  }

  await AppointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
};

export const completeDoctorAppointment = async (
  docId: string,
  appointmentId: string
): Promise<void> => {
  const appointment = await AppointmentModel.findById(appointmentId);

  if (!appointment || !appointmentBelongsToDoctor(appointment, docId)) {
    throw new AppError("Unauthorized action", 403);
  }

  await AppointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });
};

export const changeDoctorAvailability = async (docId: string): Promise<void> => {
  const doctor = await DoctorModel.findById(docId);

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  await DoctorModel.findByIdAndUpdate(docId, { available: !doctor.available });
};

export const getDoctorProfile = async (docId: string): Promise<unknown> => {
  const doctor = await DoctorModel.findById(docId).select("-password");

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  return removeSensitiveFields(doctor);
};

export const updateDoctorProfile = async (
  docId: string,
  payload: DoctorProfileUpdate
): Promise<void> => {
  const update: Partial<Doctor> = {
    fees: payload.fees,
    address: payload.address,
    available: payload.available
  };

  if (payload.about) {
    update.about = payload.about;
  }

  const doctor = await DoctorModel.findByIdAndUpdate(docId, update, {
    new: true,
    runValidators: true
  });

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }
};

export const getDoctorDashboard = async (docId: string): Promise<Record<string, unknown>> => {
  const appointments = await AppointmentModel.find({ docId }).sort({ date: -1 });
  const earnings = appointments.reduce(
    (total, appointment) =>
      total + (appointment.isCompleted || appointment.payment ? appointment.amount : 0),
    0
  );

  const patients = new Set(appointments.map((appointment) => appointment.userId));

  return {
    earnings,
    appointments: appointments.length,
    patients: patients.size,
    latestAppointments: appointments
  };
};
