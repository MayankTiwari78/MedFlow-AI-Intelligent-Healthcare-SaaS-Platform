import type { RequestHandler } from "express";

import {
  loginAdminAccount,
  loginDoctorAccount,
  loginPatient,
  registerPatient
} from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

export const registerUser: RequestHandler = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  const { token } = await registerPatient(name, email, password);
  sendSuccess(res, 201, "Registration successful", { token }, { token });
});

export const loginUser: RequestHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const { token } = await loginPatient(email, password);
  sendSuccess(res, 200, "Login successful", { token }, { token });
});

export const loginDoctor: RequestHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const { token } = await loginDoctorAccount(email, password);
  sendSuccess(res, 200, "Login successful", { token }, { token });
});

export const loginAdmin: RequestHandler = asyncHandler((req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const { token } = loginAdminAccount(email, password);
  sendSuccess(res, 200, "Login successful", { token }, { token });
});
