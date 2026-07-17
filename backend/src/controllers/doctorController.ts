import type { RequestHandler } from "express";

import {
  cancelDoctorAppointment,
  changeDoctorAvailability,
  completeDoctorAppointment,
  getDoctorDashboard,
  getDoctorProfile,
  listDoctorAppointments,
  listPublicDoctors,
  updateDoctorProfile as updateDoctorProfileService
} from "../services/doctorService.js";
import type { Address } from "../types/domain.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const requireDoctorId = (doctorId?: string): string => {
  if (!doctorId) {
    throw new AppError("Not Authorized Login Again", 401);
  }

  return doctorId;
};

export const appointmentsDoctor: RequestHandler = asyncHandler(async (req, res) => {
  const appointments = await listDoctorAppointments(requireDoctorId(req.authDoctorId));
  sendSuccess(res, 200, "Appointments loaded", { appointments }, { appointments });
});

export const appointmentCancel: RequestHandler = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body as { appointmentId: string };
  await cancelDoctorAppointment(requireDoctorId(req.authDoctorId), appointmentId);
  sendSuccess(res, 200, "Appointment Cancelled");
});

export const appointmentComplete: RequestHandler = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body as { appointmentId: string };
  await completeDoctorAppointment(requireDoctorId(req.authDoctorId), appointmentId);
  sendSuccess(res, 200, "Appointment Completed");
});

export const doctorList: RequestHandler = asyncHandler(async (_req, res) => {
  const doctors = await listPublicDoctors();
  sendSuccess(res, 200, "Doctors loaded", { doctors }, { doctors });
});

export const changeAvailablity: RequestHandler = asyncHandler(async (req, res) => {
  const docId = (req.body as { docId?: string }).docId ?? requireDoctorId(req.authDoctorId);
  await changeDoctorAvailability(docId);
  sendSuccess(res, 200, "Availablity Changed");
});

export const doctorProfile: RequestHandler = asyncHandler(async (req, res) => {
  const profileData = await getDoctorProfile(requireDoctorId(req.authDoctorId));
  sendSuccess(res, 200, "Profile loaded", { profileData }, { profileData });
});

export const updateDoctorProfile: RequestHandler = asyncHandler(async (req, res) => {
  const payload = req.body as {
    fees: number;
    address: Address;
    available: boolean;
    about?: string;
  };

  await updateDoctorProfileService(requireDoctorId(req.authDoctorId), payload);
  sendSuccess(res, 200, "Profile Updated");
});

export const doctorDashboard: RequestHandler = asyncHandler(async (req, res) => {
  const dashData = await getDoctorDashboard(requireDoctorId(req.authDoctorId));
  sendSuccess(res, 200, "Dashboard loaded", { dashData }, { dashData });
});
