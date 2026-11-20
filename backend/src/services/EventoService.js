import { EstadoCompra, Evento, TipoEntrada } from "../domain/index.js";
import { BusinessRuleError } from "./errors/ServiceError.js";

function normalizarTexto(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export class EventoService {
  constructor({
    eventoRepository,
    categoriaRepository,
    usuarioRepository,
    compraRepository,
    reseniaService,
  }) {
    this.eventoRepository = eventoRepository;
    this.categoriaRepository = categoriaRepository;
    this.usuarioRepository = usuarioRepository;
    this.compraRepository = compraRepository;
    this.reseniaService = reseniaService;
  }

  enriquecerEvento(evento, fechaReferencia = new Date()) {
    const { puntajeEvento, cantidadReseniasEvento } =
      this.reseniaService.obtenerResumenPorEvento(evento.id);
    const { puntajeOrganizador, cantidadReseniasOrganizador } =
      this.reseniaService.calcularPuntajeOrganizador(evento.organizador.id);

    return {
      ...evento.toJSON(),
      yaOcurrio: evento.yaOcurrio(fechaReferencia),
      puntajeEvento,
      cantidadReseniasEvento,
      puntajeOrganizador,
      cantidadReseniasOrganizador,
    };
  }

  listarEventos({
    q,
    categoriaId,
    organizadorId,
    precioMin,
    precioMax,
    soloFuturos,
    ordenarPor = "fecha",
    orden,
    fechaActual = new Date(),
  } = {}) {
    if (precioMin !== undefined && precioMax !== undefined) {
      const min = Number(precioMin);
      const max = Number(precioMax);
      if (min > max) {
        throw new BusinessRuleError("El precio mínimo no puede ser mayor al precio máximo");
      }
    }

    let eventos = this.eventoRepository.findAll();

    if (q && q.trim() !== "") {
      const busqueda = normalizarTexto(q.trim());
      eventos = eventos.filter(
        (evento) =>
          normalizarTexto(evento.nombre).includes(busqueda) ||
          normalizarTexto(evento.descripcion).includes(busqueda)
      );
    }

    if (categoriaId !== undefined && categoriaId !== "") {
      const catId = Number(categoriaId);
      eventos = eventos.filter((evento) => evento.categoria.id === catId);
    }

    if (organizadorId !== undefined && organizadorId !== "") {
      const orgId = Number(organizadorId);
      eventos = eventos.filter((evento) => evento.organizador.id === orgId);
    }

    if (precioMin !== undefined || precioMax !== undefined) {
      const min = precioMin !== undefined ? Number(precioMin) : 0;
      const max = precioMax !== undefined ? Number(precioMax) : Number.MAX_SAFE_INTEGER;
      eventos = eventos.filter((evento) => evento.tuPrecioEstaEntre(min, max));
    }

    if (soloFuturos === true || soloFuturos === "true") {
      eventos = eventos.filter((evento) => !evento.yaOcurrio(fechaActual));
    }

    const enriquecidos = eventos.map((evento) => this.enriquecerEvento(evento, fechaActual));

    const direccion = orden || (ordenarPor === "puntaje" ? "desc" : "asc");
    const factor = direccion === "desc" ? -1 : 1;

    enriquecidos.sort((a, b) => {
      if (ordenarPor === "precio") {
        return (a.precioMinimo - b.precioMinimo) * factor;
      }
      if (ordenarPor === "puntaje") {
        const aSinResenias = a.cantidadReseniasOrganizador === 0;
        const bSinResenias = b.cantidadReseniasOrganizador === 0;
        if (aSinResenias !== bSinResenias) {
          return aSinResenias ? 1 : -1;
        }
        return (a.puntajeOrganizador - b.puntajeOrganizador) * factor;
      }
      return (new Date(a.fecha).getTime() - new Date(b.fecha).getTime()) * factor;
    });

    return enriquecidos;
  }

  obtenerEventoDetalle(eventoId) {
    const evento = this.eventoRepository.findByIdOrThrow(eventoId);
    const resumenEvento = this.reseniaService.obtenerResumenPorEvento(evento.id);
    const resumenOrganizador = this.reseniaService.obtenerResumenPorOrganizador(
      evento.organizador.id
    );

    return {
      ...evento.toJSON(),
      yaOcurrio: evento.yaOcurrio(),
      puntajeEvento: resumenEvento.puntajeEvento,
      cantidadReseniasEvento: resumenEvento.cantidadReseniasEvento,
      reseniasEvento: resumenEvento.resenias,
      puntajeOrganizador: resumenOrganizador.puntajeOrganizador,
      cantidadReseniasOrganizador: resumenOrganizador.cantidadResenias,
      reseniasOrganizador: resumenOrganizador.resenias,
      reseniasEventosAnterioresOrganizador: resumenOrganizador.resenias.filter(
        (r) => r.eventoId !== evento.id
      ),
    };
  }

  crearEvento({
    nombre,
    descripcion,
    categoriaId,
    organizadorId,
    fecha,
    multimedia = [],
    tiposEntrada = [],
    fechaActual = new Date(),
  }) {
    const categoria = this.categoriaRepository.findByIdOrThrow(categoriaId);
    const organizador = this.usuarioRepository.findByIdOrThrow(organizadorId);

    const nombresNormalizados = new Set();
    for (const tipo of tiposEntrada) {
      const clave = normalizarTexto(String(tipo.nombre).trim());
      if (nombresNormalizados.has(clave)) {
        throw new BusinessRuleError(
          "No se pueden definir tipos de entrada con nombres duplicados en el mismo evento"
        );
      }
      nombresNormalizados.add(clave);
    }

    const entradas = tiposEntrada.map(
      (tipo) =>
        new TipoEntrada({
          nombre: tipo.nombre,
          descripcion: tipo.descripcion,
          precio: tipo.precio,
          cupo: tipo.cupo,
        })
    );

    const evento = new Evento({
      nombre,
      descripcion,
      categoria,
      fecha,
      tiposEntrada: entradas,
      multimedia,
      organizador,
    });

    if (evento.yaOcurrio(fechaActual)) {
      throw new BusinessRuleError("La fecha del evento debe ser futura");
    }

    this.eventoRepository.save(evento);
    return this.enriquecerEvento(evento, fechaActual);
  }

  obtenerComprasYDisponibilidad(eventoId, { organizadorId } = {}) {
    const evento = this.eventoRepository.findByIdOrThrow(eventoId);
    if (organizadorId !== undefined && organizadorId !== "") {
      const organizador = this.usuarioRepository.findByIdOrThrow(organizadorId);
      if (evento.organizador.id !== organizador.id) {
        throw new BusinessRuleError(
          "Solo el organizador del evento puede consultar sus compras y disponibilidad"
        );
      }
    }

    const compras = this.compraRepository.findByEventoId(evento.id);
    const reseniasEvento = this.reseniaService.obtenerResumenPorEvento(evento.id).resenias;

    const disponibilidadPorTipo = evento.tiposEntrada.map((tipo) => {
      const entradasVendidas = compras
        .filter(
          (c) =>
            c.tipoEntrada.id === tipo.id &&
            (c.estado === EstadoCompra.CONFIRMADA || c.estado === EstadoCompra.UTILIZADA)
        )
        .reduce((acc, c) => acc + c.cantidad, 0);

      const entradasReservadas = compras
        .filter((c) => c.tipoEntrada.id === tipo.id && c.estado === EstadoCompra.PENDIENTE)
        .reduce((acc, c) => acc + c.cantidad, 0);

      return {
        ...tipo.toJSON(),
        cupoDisponible: tipo.cupo,
        entradasVendidas,
        entradasReservadas,
      };
    });

    return {
      evento: this.enriquecerEvento(evento),
      disponibilidadPorTipo,
      compras: compras.map((c) => ({
        ...c.toJSON(),
        yaReseniado: reseniasEvento.some((r) => r.comprador.id === c.comprador.id),
      })),
    };
  }
}
