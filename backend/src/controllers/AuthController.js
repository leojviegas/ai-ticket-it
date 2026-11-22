import { validateSchema } from "../schemas/validator.js";
import { registerSchema, loginSchema } from "../schemas/authSchemas.js";

export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  register = async (req, res, next) => {
    try {
      const datos = validateSchema(registerSchema, req.body ?? {});
      const resultado = await this.authService.register(datos);
      res.status(201).json(resultado);
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const credenciales = validateSchema(loginSchema, req.body ?? {});
      const resultado = await this.authService.login(credenciales);
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  };

  me = (req, res, next) => {
    try {
      const usuario = this.authService.obtenerUsuarioActual(req.user.id);
      res.status(200).json(usuario);
    } catch (error) {
      next(error);
    }
  };
}
