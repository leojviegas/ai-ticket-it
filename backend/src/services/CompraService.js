import { Compra, EstadoCompra } from "../domain/index.js";
import { BusinessRuleError, NotFoundError } from "./errors/ServiceError.js";

export class CompraService {
  constructor({ compraRepository, usuarioRepository, eventoRepository }) {
    this.compraRepository = compraRepository;
    this.usuarioRepository = usuarioRepository;
    this.eventoRepository = eventoRepository;
  }

  crearCompra({ compradorId, eventoId, tipoEntradaId, cantidad }) {
    const comprador = this.usuarioRepository.findByIdOrThrow(compradorId);
    const evento = this.eventoRepository.findByIdOrThrow(eventoId);

    const tipoEntrada = evento.tiposEntrada.find((t) => t.id === Number(tipoEntradaId));
    if (!tipoEntrada) {
      throw new NotFoundError(
        `Tipo de entrada con id ${tipoEntradaId} no encontrado en el evento ${evento.id}`
      );
    }

    tipoEntrada.descontarCupo(cantidad);

    const compra = new Compra({
      comprador,
      evento,
      tipoEntrada,
      cantidad,
      estado: EstadoCompra.PENDIENTE,
    });

    this.compraRepository.save(compra);
    return compra.toJSON();
  }

  listarCompras({ compradorId, eventoId } = {}) {
    let compras = this.compraRepository.findAll();

    if (compradorId !== undefined && compradorId !== "") {
      const cId = Number(compradorId);
      compras = compras.filter((c) => c.comprador.id === cId);
    }

    if (eventoId !== undefined && eventoId !== "") {
      const eId = Number(eventoId);
      compras = compras.filter((c) => c.evento.id === eId);
    }

    return compras.map((c) => c.toJSON());
  }

  obtenerCompraPorId(id) {
    const compra = this.compraRepository.findByIdOrThrow(id);
    return compra.toJSON();
  }

  actualizarEstado(compraId, { estado, usuarioId }) {
    const compra = this.compraRepository.findByIdOrThrow(compraId);
    const usuario = this.usuarioRepository.findByIdOrThrow(usuarioId);

    if (compra.evento.organizador.id !== usuario.id) {
      throw new BusinessRuleError(
        "Solo el organizador del evento puede actualizar el estado de esta compra"
      );
    }

    compra.actualizarEstado(estado, usuario);
    return compra.toJSON();
  }

  cancelarCompra(compraId, { usuarioId, fechaActual = new Date() }) {
    const compra = this.compraRepository.findByIdOrThrow(compraId);
    const usuario = this.usuarioRepository.findByIdOrThrow(usuarioId);

    const esComprador = compra.comprador.id === usuario.id;
    const esOrganizador = compra.evento.organizador.id === usuario.id;

    if (!esComprador && !esOrganizador) {
      throw new BusinessRuleError("No tienes permiso para cancelar esta compra");
    }

    // ADR 002 (DUDA-06, Opción A): en PENDIENTE pueden cancelar comprador u organizador;
    // en CONFIRMADA solo el comprador puede cancelar.
    if (compra.estado === EstadoCompra.CONFIRMADA && !esComprador) {
      throw new BusinessRuleError("Solo el comprador puede cancelar una compra confirmada");
    }

    compra.cancelar(usuario, fechaActual);
    return compra.toJSON();
  }

  reembolsarCompra(compraId, { usuarioId }) {
    const compra = this.compraRepository.findByIdOrThrow(compraId);
    const usuario = this.usuarioRepository.findByIdOrThrow(usuarioId);

    if (compra.evento.organizador.id !== usuario.id) {
      throw new BusinessRuleError(
        "Solo el organizador del evento puede emitir el reembolso de esta compra"
      );
    }

    compra.reembolsar(usuario);
    return compra.toJSON();
  }

  agregarMensaje(compraId, { usuarioId, mensaje }) {
    const compra = this.compraRepository.findByIdOrThrow(compraId);
    const usuario = this.usuarioRepository.findByIdOrThrow(usuarioId);

    const nuevoMensaje = compra.agregarMensaje(usuario, mensaje);
    return {
      mensaje: nuevoMensaje.toJSON(),
      compra: compra.toJSON(),
    };
  }
}
