import { validateSchema, validateIdParam } from "../schemas/validator.js";
import { crearReseniaSchema, listarReseniasQuerySchema } from "../schemas/reseniaSchemas.js";

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
    const resenia = this.reseniaService.crearResenia(datos);
    res.status(201).json(resenia);
  };

  obtenerPorOrganizador = (req, res) => {
    const id = validateIdParam(req.params);
    const resumen = this.reseniaService.obtenerResumenPorOrganizador(id);
    res.json(resumen);
  };
}
