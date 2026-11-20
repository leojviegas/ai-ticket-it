import { DomainValidationError } from "../errors/DomainError.js";
import { generarId } from "../utils/idGenerator.js";

export class Mensaje {
  constructor({ id = generarId(), usuario, mensaje, enviado = new Date() } = {}) {
    if (!usuario) {
      throw new DomainValidationError("El usuario emisor del mensaje es obligatorio");
    }
    if (typeof mensaje !== "string" || mensaje.trim() === "") {
      throw new DomainValidationError("El contenido del mensaje no puede estar vacío");
    }

    this.id = id;
    this.usuario = usuario;
    this.mensaje = mensaje.trim();
    this.enviado = enviado;
  }

  toJSON() {
    return {
      id: this.id,
      usuario: this.usuario.toJSON(),
      mensaje: this.mensaje,
      enviado: this.enviado,
    };
  }
}

