import { validateSchema, validateIdParam } from "../schemas/validator.js";
import {
  crearEventoSchema,
  listarEventosQuerySchema,
  obtenerComprasEventoQuerySchema,
} from "../schemas/eventoSchemas.js";
import { ForbiddenError } from "../services/errors/ServiceError.js";

export class EventoController {
  constructor(eventoService) {
    this.eventoService = eventoService;
  }

  listar = (req, res) => {
    const filtros = validateSchema(listarEventosQuerySchema, req.query);
    const eventos = this.eventoService.listarEventos(filtros);
    res.json(eventos);
  };

  obtenerDetalle = (req, res) => {
    const id = validateIdParam(req.params);
    const evento = this.eventoService.obtenerEventoDetalle(id);
    res.json(evento);
  };

  crear = (req, res) => {
    const datos = validateSchema(crearEventoSchema, req.body);
    if (datos.organizadorId !== undefined && req.user && datos.organizadorId !== req.user.id) {
      throw new ForbiddenError("No tienes permiso para crear eventos en nombre de otro usuario");
    }
    const organizadorId = req.user ? req.user.id : datos.organizadorId;
    const evento = this.eventoService.crearEvento({ ...datos, organizadorId });
    res.status(201).json(evento);
  };

  obtenerComprasYDisponibilidad = (req, res) => {
    const id = validateIdParam(req.params);
    const filtros = validateSchema(obtenerComprasEventoQuerySchema, req.query);
    if (filtros.organizadorId !== undefined && req.user && filtros.organizadorId !== req.user.id) {
      throw new ForbiddenError(
        "No tienes permiso para consultar compras en nombre de otro organizador"
      );
    }
    const organizadorId = req.user ? req.user.id : filtros.organizadorId;
    const resultado = this.eventoService.obtenerComprasYDisponibilidad(id, {
      organizadorId,
      estado: filtros.estado,
    });
    res.json(resultado);
  };
}
