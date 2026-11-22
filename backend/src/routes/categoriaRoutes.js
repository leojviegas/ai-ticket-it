import { Router } from "express";
import { categoriaService } from "../services/index.js";
import { CategoriaController } from "../controllers/CategoriaController.js";

const router = Router();
const controller = new CategoriaController(categoriaService);

router.get("/", controller.listar);

export default router;
