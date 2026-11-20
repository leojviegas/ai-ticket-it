import { validateSchema, validateIdParam } from "../schemas/validator.js";
import { toggleFavoritoSchema } from "../schemas/usuarioSchemas.js";

export class UsuarioController {
  constructor(usuarioService) {
    this.usuarioService = usuarioService;
  }

  listar = (req, res) => {
    const usuarios = this.usuarioService.listarUsuarios();
    res.json(usuarios);
  };

  obtenerPorId = (req, res) => {
    const id = validateIdParam(req.params);
    const usuario = this.usuarioService.obtenerUsuarioPorId(id);
    res.json(usuario);
  };

  toggleFavorito = (req, res) => {
    const id = validateIdParam(req.params);
    const { eventoId } = validateSchema(toggleFavoritoSchema, req.body);
    const resultado = this.usuarioService.toggleFavorito(id, eventoId);
    res.json(resultado);
  };
}
