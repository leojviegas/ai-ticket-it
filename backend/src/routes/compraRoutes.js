import { Router } from "express";
import { compraService } from "../services/index.js";
import { CompraController } from "../controllers/CompraController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();
const controller = new CompraController(compraService);

router.get("/", requireAuth, controller.listar);
router.post("/", requireAuth, controller.crear);
router.get("/:id", requireAuth, controller.obtenerPorId);
router.patch("/:id/estado", requireAuth, controller.actualizarEstado);
router.post("/:id/cancelar", requireAuth, controller.cancelar);
router.post("/:id/reembolsar", requireAuth, controller.reembolsar);
router.post("/:id/mensajes", requireAuth, controller.agregarMensaje);

export default router;
