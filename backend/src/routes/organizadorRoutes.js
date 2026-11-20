import { Router } from "express";
import { reseniaService } from "../services/index.js";
import { ReseniaController } from "../controllers/ReseniaController.js";

const router = Router();
const controller = new ReseniaController(reseniaService);

router.get("/:id/resenias", controller.obtenerPorOrganizador);

export default router;
