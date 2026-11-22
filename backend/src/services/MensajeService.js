import { ForbiddenError } from "./errors/ServiceError.js";

export class MensajeService {
  constructor({ compraRepository, usuarioRepository }) {
    this.compraRepository = compraRepository;
    this.usuarioRepository = usuarioRepository;
  }

  _obtenerComprasDeUsuario(usuarioId) {
    return this.compraRepository
      .findAll()
      .filter((c) => c.comprador.id === usuarioId || c.evento.organizador.id === usuarioId);
  }

  listarMensajes({
    usuarioAutenticadoId,
    compraId,
    conUsuarioId,
    remitenteId,
    destinatarioId,
  } = {}) {
    const usuario = this.usuarioRepository.findByIdOrThrow(usuarioAutenticadoId);
    const userId = usuario.id;

    if (
      remitenteId !== undefined &&
      destinatarioId !== undefined &&
      Number(remitenteId) !== userId &&
      Number(destinatarioId) !== userId
    ) {
      throw new ForbiddenError("No tienes permiso para consultar mensajes entre otros usuarios");
    }

    let compras;
    if (compraId !== undefined) {
      const compra = this.compraRepository.findByIdOrThrow(compraId);
      const participa =
        compra.comprador.id === userId || compra.evento.organizador.id === userId;
      if (!participa) {
        throw new ForbiddenError("No tienes permiso para acceder a los mensajes de esta compra");
      }
      compras = [compra];
    } else {
      compras = this._obtenerComprasDeUsuario(userId);
    }

    let mensajes = compras.flatMap((compra) => {
      const rolUsuario = compra.comprador.id === userId ? "COMPRADOR" : "ORGANIZADOR";
      return compra.mensajes.map((m) => ({
        ...m.toJSON(),
        compraId: compra.id,
        eventoId: compra.evento.id,
        eventoNombre: compra.evento.nombre,
        estadoCompra: compra.estado,
        rolUsuario,
      }));
    });

    if (conUsuarioId !== undefined) {
      const otroId = Number(conUsuarioId);
      mensajes = mensajes.filter(
        (m) =>
          (m.remitente.id === userId && m.destinatario.id === otroId) ||
          (m.remitente.id === otroId && m.destinatario.id === userId)
      );
    }

    if (remitenteId !== undefined) {
      const remId = Number(remitenteId);
      mensajes = mensajes.filter((m) => m.remitente.id === remId);
    }

    if (destinatarioId !== undefined) {
      const destId = Number(destinatarioId);
      mensajes = mensajes.filter((m) => m.destinatario.id === destId);
    }

    mensajes.sort((a, b) => new Date(a.enviado).getTime() - new Date(b.enviado).getTime());
    return mensajes;
  }

  listarConversaciones(usuarioAutenticadoId, { incluirVacias = false } = {}) {
    const usuario = this.usuarioRepository.findByIdOrThrow(usuarioAutenticadoId);
    const userId = usuario.id;

    let conversaciones = this._obtenerComprasDeUsuario(userId).map((compra) => {
      const esComprador = compra.comprador.id === userId;
      const contraparte = esComprador ? compra.evento.organizador : compra.comprador;
      const mensajes = compra.mensajes
        .map((m) => m.toJSON())
        .sort((a, b) => new Date(a.enviado).getTime() - new Date(b.enviado).getTime());
      const ultimoMensaje = mensajes.length > 0 ? mensajes[mensajes.length - 1] : null;

      return {
        compraId: compra.id,
        eventoId: compra.evento.id,
        eventoNombre: compra.evento.nombre,
        eventoFecha: compra.evento.fecha,
        eventoMultimedia: compra.evento.multimedia,
        estadoCompra: compra.estado,
        rolUsuario: esComprador ? "COMPRADOR" : "ORGANIZADOR",
        contraparte: contraparte.toJSON(),
        cantidadMensajes: mensajes.length,
        ultimoMensaje,
        mensajes,
      };
    });

    if (!incluirVacias) {
      conversaciones = conversaciones.filter((c) => c.cantidadMensajes > 0);
    }

    conversaciones.sort((a, b) => {
      const fechaA = a.ultimoMensaje ? new Date(a.ultimoMensaje.enviado).getTime() : -1;
      const fechaB = b.ultimoMensaje ? new Date(b.ultimoMensaje.enviado).getTime() : -1;
      return fechaB - fechaA;
    });

    return conversaciones;
  }
}
