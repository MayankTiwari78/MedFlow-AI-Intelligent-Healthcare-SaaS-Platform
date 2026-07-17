import http from "node:http";

import app from "./app.js";
import { configureCloudinary } from "./config/cloudinary.js";
import { connectDB, disconnectDB } from "./config/database.js";
import { env } from "./config/env.js";

let server: http.Server | undefined;

const shutdown = async (signal: string): Promise<void> => {
  console.log(`${signal} received. Shutting down server.`);

  if (server) {
    await new Promise<void>((resolve) => {
      server?.close(() => resolve());
    });
  }

  await disconnectDB().catch(() => undefined);
  process.exit(0);
};

const start = (): void => {
  configureCloudinary();

  server = app.listen(env.PORT, () => {
    console.log(`Server started on PORT:${env.PORT}`);
  });

  connectDB().catch((error: unknown) => {
    console.error("Database startup connection failed");
    if (env.isProduction) {
      console.error(error instanceof Error ? error.message : "Unknown database error");
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection", reason);
  void shutdown("unhandledRejection");
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception", error);
  void shutdown("uncaughtException");
});

start();
