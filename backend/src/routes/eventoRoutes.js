import { Router } from "express";
import { eventoService } from "../services/index.js";
import { EventoController } from "../controllers/EventoController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();
const controller = new EventoController(eventoService);

router.get("/", controller.listar);
router.post("/", requireAuth, controller.crear);
router.get("/:id", controller.obtenerDetalle);
router.get("/:id/compras", requireAuth, controller.obtenerComprasYDisponibilidad);

export default router;
