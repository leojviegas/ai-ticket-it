import { DomainValidationError } from "../errors/DomainError.js";
import { generarId } from "../utils/idGenerator.js";

export class Categoria {
  constructor({ id = generarId(), nombre, descripcion } = {}) {
    if (
      typeof nombre !== "string" ||
      nombre.trim() === "" ||
      typeof descripcion !== "string" ||
      descripcion.trim() === ""
    ) {
      throw new DomainValidationError("El nombre y la descripción de la categoría son obligatorios");
    }
    this.id = id;
    this.nombre = nombre.trim();
    this.descripcion = descripcion.trim();
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
    };
  }
}

