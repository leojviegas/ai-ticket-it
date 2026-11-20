import { CategoriaRepository } from "./CategoriaRepository.js";
import { UsuarioRepository } from "./UsuarioRepository.js";
import { EventoRepository } from "./EventoRepository.js";
import { CompraRepository } from "./CompraRepository.js";
import { ReseniaRepository } from "./ReseniaRepository.js";

export const categoriaRepository = new CategoriaRepository();
export const usuarioRepository = new UsuarioRepository();
export const eventoRepository = new EventoRepository();
export const compraRepository = new CompraRepository();
export const reseniaRepository = new ReseniaRepository();

export function clearAllRepositories() {
  categoriaRepository.clear();
  usuarioRepository.clear();
  eventoRepository.clear();
  compraRepository.clear();
  reseniaRepository.clear();
}
