import { DomainValidationError } from "../errors/DomainError.js";
import { generarId } from "../utils/idGenerator.js";

export class TipoEntrada {
  constructor({ id = generarId(), nombre, descripcion, precio, cupo } = {}) {
    if (!nombre || !descripcion) {
      throw new DomainValidationError("El nombre y la descripción del tipo de entrada son obligatorios");
    }
    if (typeof precio !== "number" || Number.isNaN(precio) || precio < 0) {
      throw new DomainValidationError("El precio debe ser un número mayor o igual a 0");
    }
    if (!Number.isInteger(cupo) || cupo < 0) {
      throw new DomainValidationError("El cupo debe ser un entero mayor o igual a 0");
    }

    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = precio;
    this.cupo = cupo;
  }

  hayCupoPara(cantidad) {
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return false;
    }
    return this.cupo >= cantidad;
  }

  descontarCupo(cantidad) {
    if (!this.hayCupoPara(cantidad)) {
      throw new DomainValidationError("No hay cupo suficiente para la cantidad solicitada");
    }
    this.cupo -= cantidad;
  }

  restituirCupo(cantidad) {
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new DomainValidationError("La cantidad a restituir debe ser un entero positivo");
    }
    this.cupo += cantidad;
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      precio: this.precio,
      cupo: this.cupo,
    };
  }
}

