import { Router } from "express";
import { reseniaService } from "../services/index.js";
import { ReseniaController } from "../controllers/ReseniaController.js";

const router = Router();
const controller = new ReseniaController(reseniaService);

router.post("/", controller.crear);

export default router;
