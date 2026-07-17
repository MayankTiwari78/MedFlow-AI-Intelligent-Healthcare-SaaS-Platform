import mongoose from "mongoose";

import { env } from "./env.js";

export const connectDB = async (): Promise<void> => {
  mongoose.connection.on("connected", () => {
    console.log("Database connected");
  });

  mongoose.connection.on("error", () => {
    console.error("Database connection error");
  });

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: env.isTest ? 500 : 10000
  });
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};

export const isDatabaseReady = (): boolean => Number(mongoose.connection.readyState) === 1;
