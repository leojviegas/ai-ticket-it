import { BaseMemoryRepository } from "./BaseMemoryRepository.js";

export class UsuarioRepository extends BaseMemoryRepository {
  constructor() {
    super("Usuario");
  }

  findByEmail(email) {
    if (typeof email !== "string" || email.trim() === "") {
      return null;
    }
    const emailNormalizado = email.trim().toLowerCase();
    return (
      this.findAll().find(
        (usuario) =>
          typeof usuario.email === "string" &&
          usuario.email.trim().toLowerCase() === emailNormalizado
      ) || null
    );
  }
}
