import { Router } from "express";
import { compraService } from "../services/index.js";
import { CompraController } from "../controllers/CompraController.js";

const router = Router();
const controller = new CompraController(compraService);

router.get("/", controller.listar);
router.post("/", controller.crear);
router.get("/:id", controller.obtenerPorId);
router.patch("/:id/estado", controller.actualizarEstado);
router.post("/:id/cancelar", controller.cancelar);
router.post("/:id/reembolsar", controller.reembolsar);
router.post("/:id/mensajes", controller.agregarMensaje);

export default router;
