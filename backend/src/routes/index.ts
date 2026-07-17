import { Router } from "express";

import { health, readiness } from "../controllers/healthController.js";
import adminRouter from "./adminRoutes.js";
import doctorRouter from "./doctorRoutes.js";
import userRouter from "./userRoutes.js";

const router = Router();

router.get("/health", health);
router.get("/ready", readiness);
router.use("/user", userRouter);
router.use("/admin", adminRouter);
router.use("/doctor", doctorRouter);

export default router;
