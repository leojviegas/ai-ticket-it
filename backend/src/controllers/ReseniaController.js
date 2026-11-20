import { validateSchema } from "../schemas/validator.js";
import { crearReseniaSchema } from "../schemas/reseniaSchemas.js";

export class ReseniaController {
  constructor(reseniaService) {
    this.reseniaService = reseniaService;
  }

  crear = (req, res) => {
    const datos = validateSchema(crearReseniaSchema, req.body);
    const resenia = this.reseniaService.crearResenia(datos);
    res.status(201).json(resenia);
  };

  obtenerPorOrganizador = (req, res) => {
    const resumen = this.reseniaService.obtenerResumenPorOrganizador(req.params.id);
    res.json(resumen);
  };
}
