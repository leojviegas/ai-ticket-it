import { authService } from "../services/index.js";

/**
 * Middleware Express que valida el header Authorization Bearer,
 * deja el payload decodificado del usuario en req.user y avanza con next().
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers?.authorization;
  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de autenticación no proporcionado" });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: "Token de autenticación no proporcionado" });
  }

  try {
    req.user = authService.verificarAccessToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
