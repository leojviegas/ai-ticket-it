import { Router } from "express";
import { mensajeService } from "../services/index.js";
import { MensajeController } from "../controllers/MensajeController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();
const controller = new MensajeController(mensajeService);

router.get("/", requireAuth, controller.listar);
router.get("/conversaciones", requireAuth, controller.listarConversaciones);

export default router;
