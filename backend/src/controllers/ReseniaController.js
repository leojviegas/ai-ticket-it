import { validateSchema, validateIdParam } from "../schemas/validator.js";
import { crearReseniaSchema, listarReseniasQuerySchema } from "../schemas/reseniaSchemas.js";
import { ForbiddenError } from "../services/errors/ServiceError.js";

export class ReseniaController {
  constructor(reseniaService) {
    this.reseniaService = reseniaService;
  }

  listar = (req, res) => {
    const filtros = validateSchema(listarReseniasQuerySchema, req.query);
    const resenias = this.reseniaService.listarResenias(filtros);
    res.json(resenias);
  };

  crear = (req, res) => {
    const datos = validateSchema(crearReseniaSchema, req.body);
    if (datos.compradorId !== undefined && req.user && datos.compradorId !== req.user.id) {
      throw new ForbiddenError("No tienes permiso para crear reseñas en nombre de otro usuario");
    }
    const compradorId = req.user ? req.user.id : datos.compradorId;
    const resenia = this.reseniaService.crearResenia({ ...datos, compradorId });
    res.status(201).json(resenia);
  };

  obtenerPorOrganizador = (req, res) => {
    const id = validateIdParam(req.params);
    const resumen = this.reseniaService.obtenerResumenPorOrganizador(id);
    res.json(resumen);
  };
}
