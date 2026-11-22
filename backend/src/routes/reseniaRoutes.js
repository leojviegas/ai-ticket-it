import { Router } from "express";
import { reseniaService } from "../services/index.js";
import { ReseniaController } from "../controllers/ReseniaController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();
const controller = new ReseniaController(reseniaService);

router.get("/", controller.listar);
router.post("/", requireAuth, controller.crear);

export default router;
