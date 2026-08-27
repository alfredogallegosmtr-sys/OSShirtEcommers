import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";
import { loginRateLimit, registerRateLimit } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.post("/register", registerRateLimit, register);
router.post("/login", loginRateLimit, login);

export default router;
