import { validateSchema } from "../schemas/validator.js";
import { crearEventoSchema, listarEventosQuerySchema } from "../schemas/eventoSchemas.js";

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
    const evento = this.eventoService.obtenerEventoDetalle(req.params.id);
    res.json(evento);
  };

  crear = (req, res) => {
    const datos = validateSchema(crearEventoSchema, req.body);
    const evento = this.eventoService.crearEvento(datos);
    res.status(201).json(evento);
  };

  obtenerComprasYDisponibilidad = (req, res) => {
    const resultado = this.eventoService.obtenerComprasYDisponibilidad(req.params.id);
    res.json(resultado);
  };
}
