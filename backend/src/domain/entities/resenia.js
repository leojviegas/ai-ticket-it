import { DomainValidationError } from "../errors/DomainError.js";
import { generarId } from "../utils/idGenerator.js";

export class Resenia {
  constructor({ id = generarId(), comprador, evento, detalle, puntuacion } = {}) {
    if (!comprador || !evento) {
      throw new DomainValidationError("El comprador y el evento son obligatorios para la reseña");
    }
    if (typeof detalle !== "string" || detalle.trim() === "") {
      throw new DomainValidationError("El comentario de la reseña es obligatorio");
    }
    if (typeof puntuacion !== "number" || Number.isNaN(puntuacion) || puntuacion < 1 || puntuacion > 5) {
      throw new DomainValidationError("La puntuación debe ser un número entre 1 y 5");
    }

    this.id = id;
    this.comprador = comprador;
    this.evento = evento;
    this.detalle = detalle.trim();
    this.puntuacion = puntuacion;
  }

  toJSON() {
    return {
      id: this.id,
      comprador: this.comprador.toJSON(),
      eventoId: this.evento.id,
      eventoNombre: this.evento.nombre,
      detalle: this.detalle,
      puntuacion: this.puntuacion,
    };
  }
}

