import { Compra, EstadoCompra } from "../domain/index.js";
import { BusinessRuleError, NotFoundError } from "./errors/ServiceError.js";

export class CompraService {
  constructor({
    compraRepository,
    usuarioRepository,
    eventoRepository,
    reseniaRepository = null,
  }) {
    this.compraRepository = compraRepository;
    this.usuarioRepository = usuarioRepository;
    this.eventoRepository = eventoRepository;
    this.reseniaRepository = reseniaRepository;
  }

  enriquecerCompra(compra) {
    const yaReseniado = this.reseniaRepository
      ? this.reseniaRepository.existsByCompradorYEvento(compra.comprador.id, compra.evento.id)
      : false;
    return {
      ...compra.toJSON(),
      yaReseniado,
    };
  }

  crearCompra({ compradorId, eventoId, tipoEntradaId, cantidad, fechaActual = new Date() }) {
    const comprador = this.usuarioRepository.findByIdOrThrow(compradorId);
    const evento = this.eventoRepository.findByIdOrThrow(eventoId);

    if (evento.organizador.id === comprador.id) {
      throw new BusinessRuleError(
        "El organizador no puede comprar entradas para su propio evento"
      );
    }

    if (evento.yaOcurrio(fechaActual)) {
      throw new BusinessRuleError(
        "No se pueden comprar entradas para un evento que ya se realizó"
      );
    }

    const tipoEntrada = evento.tiposEntrada.find((t) => t.id === Number(tipoEntradaId));
    if (!tipoEntrada) {
      throw new NotFoundError(
        `Tipo de entrada con id ${tipoEntradaId} no encontrado en el evento ${evento.id}`
      );
    }

    const compra = new Compra({
      comprador,
      evento,
      tipoEntrada,
      cantidad,
      estado: EstadoCompra.PENDIENTE,
    });

    tipoEntrada.descontarCupo(cantidad);

    this.compraRepository.save(compra);
    return this.enriquecerCompra(compra);
  }

  listarCompras({ compradorId, eventoId, estado, soloFuturos, fechaActual = new Date() } = {}) {
    let compras = this.compraRepository.findAll(fechaActual);

    if (compradorId !== undefined && compradorId !== "") {
      const cId = Number(compradorId);
      compras = compras.filter((c) => c.comprador.id === cId);
    }

    if (eventoId !== undefined && eventoId !== "") {
      const eId = Number(eventoId);
      compras = compras.filter((c) => c.evento.id === eId);
    }

    if (estado !== undefined && estado !== "") {
      compras = compras.filter((c) => c.estado === estado);
    }

    if (soloFuturos === true || soloFuturos === "true") {
      compras = compras.filter((c) => !c.evento.yaOcurrio(fechaActual));
    }

    return compras.map((c) => this.enriquecerCompra(c));
  }

  obtenerCompraPorId(id, { usuarioId } = {}) {
    const compra = this.compraRepository.findByIdOrThrow(id);
    if (usuarioId !== undefined && usuarioId !== "") {
      const usuario = this.usuarioRepository.findByIdOrThrow(usuarioId);
      const esComprador = compra.comprador.id === usuario.id;
      const esOrganizador = compra.evento.organizador.id === usuario.id;
      if (!esComprador && !esOrganizador) {
        throw new BusinessRuleError(
          "Solo el comprador o el organizador del evento pueden visualizar esta compra"
        );
      }
    }
    return this.enriquecerCompra(compra);
  }

  actualizarEstado(compraId, { estado, usuarioId }) {
    const compra = this.compraRepository.findByIdOrThrow(compraId);
    const usuario = this.usuarioRepository.findByIdOrThrow(usuarioId);

    if (compra.evento.organizador.id !== usuario.id) {
      throw new BusinessRuleError(
        "Solo el organizador del evento puede actualizar el estado de esta compra"
      );
    }

    if (estado === EstadoCompra.CANCELADA) {
      throw new BusinessRuleError(
        "Para cancelar una compra debes utilizar la operación de cancelación"
      );
    }

    if (estado === EstadoCompra.UTILIZADA) {
      throw new BusinessRuleError(
        "El paso a UTILIZADA es automático al alcanzarse la fecha del evento"
      );
    }

    compra.actualizarEstado(estado, usuario);
    return this.enriquecerCompra(compra);
  }

  cancelarCompra(compraId, { usuarioId, fechaActual = new Date() }) {
    const compra = this.compraRepository.findByIdOrThrow(compraId);
    const usuario = this.usuarioRepository.findByIdOrThrow(usuarioId);

    const esComprador = compra.comprador.id === usuario.id;
    const esOrganizador = compra.evento.organizador.id === usuario.id;

    if (!esComprador && !esOrganizador) {
      throw new BusinessRuleError("No tienes permiso para cancelar esta compra");
    }

    // ADR 005: tanto comprador como organizador pueden cancelar en PENDIENTE o CONFIRMADA
    // mientras el evento aún no haya ocurrido.
    compra.cancelar(usuario, fechaActual);
    return this.enriquecerCompra(compra);
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
    return this.enriquecerCompra(compra);
  }

  agregarMensaje(compraId, { usuarioId, mensaje = "", adjunto = null }) {
    const compra = this.compraRepository.findByIdOrThrow(compraId);
    const usuario = this.usuarioRepository.findByIdOrThrow(usuarioId);

    const nuevoMensaje = compra.agregarMensaje(usuario, mensaje, new Date(), adjunto);
    return {
      mensaje: nuevoMensaje.toJSON(),
      compra: this.enriquecerCompra(compra),
    };
  }
}
