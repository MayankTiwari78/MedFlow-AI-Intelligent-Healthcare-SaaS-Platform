import bcrypt from "bcrypt";

import { env } from "../config/env.js";
import DoctorModel from "../models/Doctor.js";
import UserModel from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { signAdminToken, signDoctorToken, signUserToken } from "./tokenService.js";

export interface AuthResult {
  token: string;
}

export const registerPatient = async (
  name: string,
  email: string,
  password: string
): Promise<AuthResult> => {
  const existingUser = await UserModel.findOne({ email });

  if (existingUser) {
    throw new AppError("email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await new UserModel({
    name,
    email,
    password: hashedPassword
  }).save();

  return {
    token: signUserToken(String(user._id))
  };
};

export const loginPatient = async (email: string, password: string): Promise<AuthResult> => {
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new AppError("User does not exist", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  return {
    token: signUserToken(String(user._id))
  };
};

export const loginDoctorAccount = async (email: string, password: string): Promise<AuthResult> => {
  const doctor = await DoctorModel.findOne({ email });

  if (!doctor) {
    throw new AppError("Invalid credentials", 401);
  }

  const isMatch = await bcrypt.compare(password, doctor.password);

  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  return {
    token: signDoctorToken(String(doctor._id))
  };
};

export const loginAdminAccount = (email: string, password: string): AuthResult => {
  if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
    throw new AppError("Invalid credentials", 401);
  }

  return {
    token: signAdminToken()
  };
};
