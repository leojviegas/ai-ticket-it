import { EstadoCompra } from "../enums/estadoCompra.js";
import { DomainValidationError } from "../errors/DomainError.js";
import { generarId } from "../utils/idGenerator.js";

export class CambioEstadoCompra {
  constructor({
    id = generarId(),
    compra,
    estado,
    quien,
    fechaHora = new Date(),
  } = {}) {
    if (!compra || !quien) {
      throw new DomainValidationError("La compra y el usuario son obligatorios en el cambio de estado");
    }
    if (!Object.values(EstadoCompra).includes(estado)) {
      throw new DomainValidationError(`Estado de compra inválido: ${estado}`);
    }

    this.id = id;
    this.compra = compra;
    this.estado = estado;
    this.quien = quien;
    this.fechaHora = fechaHora;
  }

  toJSON() {
    return {
      id: this.id,
      compraId: this.compra.id,
      estado: this.estado,
      quien: this.quien.toJSON(),
      fechaHora: this.fechaHora,
    };
  }
}

