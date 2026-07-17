import mongoose, { type HydratedDocument, type Model } from "mongoose";

import { DEFAULT_USER_IMAGE } from "../constants/defaults.js";
import type { Address } from "../types/domain.js";

export interface User {
  name: string;
  email: string;
  image: string;
  phone: string;
  address: Address;
  gender: string;
  dob: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserDocument = HydratedDocument<User>;

const addressSchema = new mongoose.Schema<Address>(
  {
    line1: { type: String, default: "" },
    line2: { type: String, default: "" }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema<User>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    image: { type: String, default: DEFAULT_USER_IMAGE },
    phone: { type: String, default: "000000000" },
    address: { type: addressSchema, default: () => ({ line1: "", line2: "" }) },
    gender: { type: String, default: "Not Selected" },
    dob: { type: String, default: "Not Selected" },
    password: { type: String, required: true }
  },
  { timestamps: true }
);

const UserModel =
  (mongoose.models.user as Model<User> | undefined) ?? mongoose.model<User>("user", userSchema);

export default UserModel;
