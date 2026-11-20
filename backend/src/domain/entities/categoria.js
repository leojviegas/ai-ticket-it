import { DomainValidationError } from "../errors/DomainError.js";
import { generarId } from "../utils/idGenerator.js";

export class Categoria {
  constructor({ id = generarId(), nombre, descripcion } = {}) {
    if (!nombre || !descripcion) {
      throw new DomainValidationError("El nombre y la descripción de la categoría son obligatorios");
    }
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
    };
  }
}

