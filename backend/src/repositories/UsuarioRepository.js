import { BaseMemoryRepository } from "./BaseMemoryRepository.js";

export class UsuarioRepository extends BaseMemoryRepository {
  constructor() {
    super("Usuario");
  }
}
