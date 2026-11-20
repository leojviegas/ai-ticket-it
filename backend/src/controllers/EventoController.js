import { validateSchema, validateIdParam } from "../schemas/validator.js";
import {
  crearEventoSchema,
  listarEventosQuerySchema,
  obtenerComprasEventoQuerySchema,
} from "../schemas/eventoSchemas.js";

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
    const evento = this.eventoService.crearEvento(datos);
    res.status(201).json(evento);
  };

  obtenerComprasYDisponibilidad = (req, res) => {
    const id = validateIdParam(req.params);
    const filtros = validateSchema(obtenerComprasEventoQuerySchema, req.query);
    const resultado = this.eventoService.obtenerComprasYDisponibilidad(id, filtros);
    res.json(resultado);
  };
}
