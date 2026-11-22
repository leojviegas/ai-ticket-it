import { Router } from "express";
import { authService } from "../services/index.js";
import { AuthController } from "../controllers/AuthController.js";

const router = Router();
const controller = new AuthController(authService);

router.post("/register", controller.register);
router.post("/login", controller.login);

export default router;
