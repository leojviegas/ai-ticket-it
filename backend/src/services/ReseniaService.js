import { EstadoCompra, Resenia } from "../domain/index.js";
import { BusinessRuleError, ConflictError } from "./errors/ServiceError.js";

function calcularPromedio(resenias) {
  if (resenias.length === 0) {
    return 0;
  }
  const suma = resenias.reduce((acc, r) => acc + r.puntuacion, 0);
  return Number((suma / resenias.length).toFixed(2));
}

export class ReseniaService {
  constructor({ reseniaRepository, compraRepository, usuarioRepository, eventoRepository }) {
    this.reseniaRepository = reseniaRepository;
    this.compraRepository = compraRepository;
    this.usuarioRepository = usuarioRepository;
    this.eventoRepository = eventoRepository;
  }

  crearResenia({ compradorId, eventoId, puntuacion, detalle }) {
    const comprador = this.usuarioRepository.findByIdOrThrow(compradorId);
    const evento = this.eventoRepository.findByIdOrThrow(eventoId);

    const comprasDelUsuario = this.compraRepository.findByCompradorYEvento(comprador.id, evento.id);
    const tieneEntradaUtilizada = comprasDelUsuario.some(
      (compra) => compra.estado === EstadoCompra.UTILIZADA
    );
    if (!tieneEntradaUtilizada) {
      throw new BusinessRuleError(
        "Solo puedes reseñar un evento si tienes una entrada en estado UTILIZADA"
      );
    }

    if (this.reseniaRepository.existsByCompradorYEvento(comprador.id, evento.id)) {
      throw new ConflictError("Ya registraste una reseña para este evento");
    }

    const resenia = new Resenia({
      comprador,
      evento,
      puntuacion,
      detalle,
    });
    this.reseniaRepository.save(resenia);
    return resenia.toJSON();
  }

  listarResenias({ compradorId, eventoId } = {}) {
    let resenias = this.reseniaRepository.findAll();

    if (compradorId !== undefined && compradorId !== "") {
      const cId = Number(compradorId);
      resenias = resenias.filter((r) => r.comprador.id === cId);
    }

    if (eventoId !== undefined && eventoId !== "") {
      const eId = Number(eventoId);
      resenias = resenias.filter((r) => r.evento.id === eId);
    }

    return resenias.map((r) => r.toJSON());
  }

  obtenerResumenPorEvento(eventoId) {
    const resenias = this.reseniaRepository.findByEventoId(eventoId);
    return {
      puntajeEvento: calcularPromedio(resenias),
      cantidadReseniasEvento: resenias.length,
      resenias: resenias.map((r) => r.toJSON()),
    };
  }

  obtenerResumenPorOrganizador(organizadorId) {
    const organizador = this.usuarioRepository.findByIdOrThrow(organizadorId);
    const resenias = this.reseniaRepository.findByOrganizadorId(organizador.id);
    const reseniasJson = resenias.map((r) => r.toJSON());
    return {
      organizador: organizador.toJSON(),
      puntajeOrganizador: calcularPromedio(resenias),
      cantidadResenias: resenias.length,
      cantidadReseniasOrganizador: resenias.length,
      resenias: reseniasJson,
      reseniasOrganizador: reseniasJson,
    };
  }

  calcularPuntajeOrganizador(organizadorId) {
    const resenias = this.reseniaRepository.findByOrganizadorId(organizadorId);
    return {
      puntajeOrganizador: calcularPromedio(resenias),
      cantidadReseniasOrganizador: resenias.length,
    };
  }
}
