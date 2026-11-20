import { EstadoCompra } from "../enums/estadoCompra.js";
import { DomainValidationError, InvalidStateTransitionError } from "../errors/DomainError.js";
import { generarId } from "../utils/idGenerator.js";
import { CambioEstadoCompra } from "./cambioEstadoCompra.js";
import { Mensaje } from "./mensaje.js";

const TRANSICIONES_VALIDAS = Object.freeze({
  [EstadoCompra.PENDIENTE]: [EstadoCompra.CONFIRMADA, EstadoCompra.CANCELADA],
  [EstadoCompra.CONFIRMADA]: [EstadoCompra.UTILIZADA, EstadoCompra.CANCELADA],
  [EstadoCompra.CANCELADA]: [EstadoCompra.REEMBOLSADA],
});

const MS_POR_DIA = 86400000;

export class Compra {
  constructor({
    id = generarId(),
    comprador,
    evento,
    tipoEntrada,
    cantidad,
    total,
    estado = EstadoCompra.PENDIENTE,
    mensajes = [],
    cambiosEstado = [],
  } = {}) {
    if (!comprador || !evento || !tipoEntrada) {
      throw new DomainValidationError("Faltan datos obligatorios para la compra");
    }
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new DomainValidationError("La cantidad de entradas debe ser un entero mayor a 0");
    }
    if (!Object.values(EstadoCompra).includes(estado)) {
      throw new DomainValidationError(`Estado de compra inválido: ${estado}`);
    }

    this.id = id;
    this.comprador = comprador;
    this.evento = evento;
    this.tipoEntrada = tipoEntrada;
    this.cantidad = cantidad;
    this.total = total !== undefined ? total : tipoEntrada.precio * cantidad;
    this.estado = estado;
    this.mensajes = mensajes;
    this.cambiosEstado =
      cambiosEstado.length > 0
        ? cambiosEstado
        : [new CambioEstadoCompra({ compra: this, estado, quien: comprador })];
  }

  actualizarEstado(nuevoEstado, quien = this.comprador, fechaHora = new Date()) {
    if (!Object.values(EstadoCompra).includes(nuevoEstado)) {
      throw new DomainValidationError(`Estado de compra inválido: ${nuevoEstado}`);
    }
    const permitidos = TRANSICIONES_VALIDAS[this.estado];
    if (!permitidos || !permitidos.includes(nuevoEstado)) {
      throw new InvalidStateTransitionError(
        `No se puede cambiar el estado de la compra de ${this.estado} a ${nuevoEstado}`
      );
    }
    this.estado = nuevoEstado;
    this.cambiosEstado.push(
      new CambioEstadoCompra({
        compra: this,
        estado: nuevoEstado,
        quien,
        fechaHora,
      })
    );
  }

  cancelar(quien = this.comprador, fechaActual = new Date()) {
    if (this.estado === EstadoCompra.UTILIZADA) {
      throw new InvalidStateTransitionError("No se puede cancelar una compra que ya fue utilizada");
    }
    if (this.evento.yaOcurrio(fechaActual)) {
      throw new DomainValidationError("No se puede cancelar una compra de un evento que ya se realizó");
    }
    this.actualizarEstado(EstadoCompra.CANCELADA, quien, fechaActual);
    this.tipoEntrada.restituirCupo(this.cantidad);
  }

  reembolsar(quien = this.evento.organizador, fechaActual = new Date()) {
    this.actualizarEstado(EstadoCompra.REEMBOLSADA, quien, fechaActual);
  }

  agregarMensaje(usuario, texto, enviado = new Date()) {
    if (!usuario) {
      throw new DomainValidationError("El usuario emisor del mensaje es obligatorio");
    }
    const esComprador = usuario.id === this.comprador.id;
    const esOrganizador = usuario.id === this.evento.organizador.id;
    if (!esComprador && !esOrganizador) {
      throw new DomainValidationError(
        "Solo el comprador o el organizador del evento pueden enviar mensajes en esta compra"
      );
    }
    const nuevoMensaje = new Mensaje({ usuario, mensaje: texto, enviado });
    this.mensajes.push(nuevoMensaje);
    return nuevoMensaje;
  }

  calcularDiasParaEvento(fechaReferencia = new Date()) {
    if (this.estado !== EstadoCompra.CONFIRMADA) {
      return null;
    }
    const diferenciaMs = this.evento.fecha.getTime() - fechaReferencia.getTime();
    return Math.max(0, Math.ceil(diferenciaMs / MS_POR_DIA));
  }

  toJSON(fechaReferencia = new Date()) {
    return {
      id: this.id,
      comprador: this.comprador.toJSON(),
      evento: this.evento.toJSON(),
      tipoEntrada: this.tipoEntrada.toJSON(),
      cantidad: this.cantidad,
      total: this.total,
      estado: this.estado,
      diasParaEvento: this.calcularDiasParaEvento(fechaReferencia),
      mensajes: this.mensajes.map((m) => m.toJSON()),
      cambiosEstado: this.cambiosEstado.map((c) => c.toJSON()),
    };
  }
}

