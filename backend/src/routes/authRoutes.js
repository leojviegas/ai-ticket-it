import { Router } from "express";
import { authService } from "../services/index.js";
import { AuthController } from "../controllers/AuthController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();
const controller = new AuthController(authService);

router.post("/register", controller.register);
router.post("/login", controller.login);
router.get("/me", requireAuth, controller.me);

export default router;
