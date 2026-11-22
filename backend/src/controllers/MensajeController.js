import { validateSchema } from "../schemas/validator.js";
import {
  listarMensajesQuerySchema,
  listarConversacionesQuerySchema,
} from "../schemas/mensajeSchemas.js";

export class MensajeController {
  constructor(mensajeService) {
    this.mensajeService = mensajeService;
  }

  listar = (req, res) => {
    const filtros = validateSchema(listarMensajesQuerySchema, req.query);
    const mensajes = this.mensajeService.listarMensajes({
      usuarioAutenticadoId: req.user.id,
      ...filtros,
    });
    res.json(mensajes);
  };

  listarConversaciones = (req, res) => {
    const filtros = validateSchema(listarConversacionesQuerySchema, req.query);
    const conversaciones = this.mensajeService.listarConversaciones(req.user.id, filtros);
    res.json(conversaciones);
  };
}
