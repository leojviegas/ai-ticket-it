import { validateSchema } from "../schemas/validator.js";
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
    const usuario = this.usuarioService.obtenerUsuarioPorId(req.params.id);
    res.json(usuario);
  };

  toggleFavorito = (req, res) => {
    const { eventoId } = validateSchema(toggleFavoritoSchema, req.body);
    const resultado = this.usuarioService.toggleFavorito(req.params.id, eventoId);
    res.json(resultado);
  };
}
