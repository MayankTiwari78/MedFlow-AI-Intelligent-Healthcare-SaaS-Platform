import type { RequestHandler } from "express";

import {
  cancelAdminAppointment,
  createDoctor,
  getAdminDashboard,
  listAllAppointments,
  listAllDoctors
} from "../services/adminService.js";
import { changeDoctorAvailability } from "../services/doctorService.js";
import type { Address } from "../types/domain.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

export const appointmentsAdmin: RequestHandler = asyncHandler(async (_req, res) => {
  const appointments = await listAllAppointments();
  sendSuccess(res, 200, "Appointments loaded", { appointments }, { appointments });
});

export const appointmentCancel: RequestHandler = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body as { appointmentId: string };
  await cancelAdminAppointment(appointmentId);
  sendSuccess(res, 200, "Appointment Cancelled");
});

export const addDoctor: RequestHandler = asyncHandler(async (req, res) => {
  const payload = req.body as {
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

  await createDoctor(payload, req.file);
  sendSuccess(res, 201, "Doctor Added");
});

export const allDoctors: RequestHandler = asyncHandler(async (_req, res) => {
  const doctors = await listAllDoctors();
  sendSuccess(res, 200, "Doctors loaded", { doctors }, { doctors });
});

export const adminDashboard: RequestHandler = asyncHandler(async (_req, res) => {
  const dashData = await getAdminDashboard();
  sendSuccess(res, 200, "Dashboard loaded", { dashData }, { dashData });
});

export const adminChangeAvailability: RequestHandler = asyncHandler(async (req, res) => {
  const { docId } = req.body as { docId: string };
  await changeDoctorAvailability(docId);
  sendSuccess(res, 200, "Availablity Changed");
});
