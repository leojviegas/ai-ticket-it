import {
  categoriaRepository,
  usuarioRepository,
  eventoRepository,
  compraRepository,
  reseniaRepository,
} from "../repositories/index.js";
import { CategoriaService } from "./CategoriaService.js";
import { ReseniaService } from "./ReseniaService.js";
import { UsuarioService } from "./UsuarioService.js";
import { EventoService } from "./EventoService.js";
import { CompraService } from "./CompraService.js";

export const categoriaService = new CategoriaService(categoriaRepository);
export const reseniaService = new ReseniaService({
  reseniaRepository,
  compraRepository,
  usuarioRepository,
  eventoRepository,
});
export const usuarioService = new UsuarioService({
  usuarioRepository,
  eventoRepository,
  reseniaService,
});
export const eventoService = new EventoService({
  eventoRepository,
  categoriaRepository,
  usuarioRepository,
  compraRepository,
  reseniaService,
});
export const compraService = new CompraService({
  compraRepository,
  usuarioRepository,
  eventoRepository,
  reseniaRepository,
});
