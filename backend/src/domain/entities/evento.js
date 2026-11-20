import { DomainValidationError } from "../errors/DomainError.js";
import { generarId } from "../utils/idGenerator.js";

export class Evento {
  constructor({
    id = generarId(),
    nombre,
    descripcion,
    categoria,
    fecha,
    tiposEntrada,
    multimedia = [],
    organizador,
  } = {}) {
    if (!nombre || !descripcion || !categoria || !organizador || !fecha) {
      throw new DomainValidationError("Faltan datos obligatorios para el evento");
    }
    const fechaNormalizada = fecha instanceof Date ? fecha : new Date(fecha);
    if (Number.isNaN(fechaNormalizada.getTime())) {
      throw new DomainValidationError("La fecha del evento no es válida");
    }
    if (!Array.isArray(tiposEntrada) || tiposEntrada.length === 0) {
      throw new DomainValidationError("El evento debe tener al menos un tipo de entrada");
    }

    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.categoria = categoria;
    this.fecha = fechaNormalizada;
    this.tiposEntrada = tiposEntrada;
    this.multimedia = multimedia;
    this.organizador = organizador;
  }

  tuPrecioEstaEntre(min, max) {
    return this.tiposEntrada.some((tipo) => tipo.precio >= min && tipo.precio <= max);
  }

  obtenerPrecioMinimo() {
    return Math.min(...this.tiposEntrada.map((tipo) => tipo.precio));
  }

  yaOcurrio(fechaReferencia = new Date()) {
    return this.fecha.getTime() <= fechaReferencia.getTime();
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      categoria: this.categoria.toJSON(),
      fecha: this.fecha,
      tiposEntrada: this.tiposEntrada.map((tipo) => tipo.toJSON()),
      multimedia: this.multimedia,
      organizador: this.organizador.toJSON(),
      precioMinimo: this.obtenerPrecioMinimo(),
    };
  }
}

