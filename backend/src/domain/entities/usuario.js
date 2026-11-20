import { DomainValidationError } from "../errors/DomainError.js";
import { generarId } from "../utils/idGenerator.js";

export class Usuario {
  constructor({ id = generarId(), nombre, apellido, favoritos = [] } = {}) {
    if (
      typeof nombre !== "string" ||
      nombre.trim() === "" ||
      typeof apellido !== "string" ||
      apellido.trim() === ""
    ) {
      throw new DomainValidationError("El nombre y el apellido del usuario son obligatorios");
    }
    this.id = id;
    this.nombre = nombre.trim();
    this.apellido = apellido.trim();
    this.favoritos = favoritos;
  }

  agregarFavorito(evento) {
    if (!evento) {
      throw new DomainValidationError("El evento es obligatorio para agregarlo a favoritos");
    }
    if (!this.esFavorito(evento.id)) {
      this.favoritos.push(evento);
    }
  }

  quitarFavorito(eventoId) {
    this.favoritos = this.favoritos.filter((evento) => evento.id !== eventoId);
  }

  esFavorito(eventoId) {
    return this.favoritos.some((evento) => evento.id === eventoId);
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      apellido: this.apellido,
      favoritosIds: this.favoritos.map((evento) => evento.id),
    };
  }
}

