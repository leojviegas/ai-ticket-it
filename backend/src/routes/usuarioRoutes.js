import { Router } from "express";
import { usuarioService } from "../services/index.js";
import { UsuarioController } from "../controllers/UsuarioController.js";

const router = Router();
const controller = new UsuarioController(usuarioService);

router.get("/", controller.listar);
router.get("/:id", controller.obtenerPorId);
router.post("/:id/favoritos", controller.toggleFavorito);

export default router;
