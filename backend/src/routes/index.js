import { Router } from "express";
import authRoutes from "./authRoutes.js";
import categoriaRoutes from "./categoriaRoutes.js";
import usuarioRoutes from "./usuarioRoutes.js";
import eventoRoutes from "./eventoRoutes.js";
import compraRoutes from "./compraRoutes.js";
import reseniaRoutes from "./reseniaRoutes.js";
import organizadorRoutes from "./organizadorRoutes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", storage: "in-memory" });
});

router.use("/auth", authRoutes);
router.use("/categorias", categoriaRoutes);
router.use("/usuarios", usuarioRoutes);
router.use("/eventos", eventoRoutes);
router.use("/compras", compraRoutes);
router.use("/resenias", reseniaRoutes);
router.use("/organizadores", organizadorRoutes);

export default router;
