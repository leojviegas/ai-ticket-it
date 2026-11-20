import { EstadoCompra, Evento, TipoEntrada } from "../domain/index.js";

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

  enriquecerEvento(evento) {
    const { puntajeEvento, cantidadReseniasEvento } =
      this.reseniaService.obtenerResumenPorEvento(evento.id);
    const { puntajeOrganizador, cantidadReseniasOrganizador } =
      this.reseniaService.calcularPuntajeOrganizador(evento.organizador.id);

    return {
      ...evento.toJSON(),
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
    ordenarPor = "fecha",
    orden,
  } = {}) {
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

    const enriquecidos = eventos.map((evento) => this.enriquecerEvento(evento));

    const direccion = orden || (ordenarPor === "puntaje" ? "desc" : "asc");
    const factor = direccion === "desc" ? -1 : 1;

    enriquecidos.sort((a, b) => {
      if (ordenarPor === "precio") {
        return (a.precioMinimo - b.precioMinimo) * factor;
      }
      if (ordenarPor === "puntaje") {
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
      puntajeEvento: resumenEvento.puntajeEvento,
      cantidadReseniasEvento: resumenEvento.cantidadReseniasEvento,
      reseniasEvento: resumenEvento.resenias,
      puntajeOrganizador: resumenOrganizador.puntajeOrganizador,
      cantidadReseniasOrganizador: resumenOrganizador.cantidadResenias,
      reseniasOrganizador: resumenOrganizador.resenias,
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
  }) {
    const categoria = this.categoriaRepository.findByIdOrThrow(categoriaId);
    const organizador = this.usuarioRepository.findByIdOrThrow(organizadorId);

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

    this.eventoRepository.save(evento);
    return this.enriquecerEvento(evento);
  }

  obtenerComprasYDisponibilidad(eventoId) {
    const evento = this.eventoRepository.findByIdOrThrow(eventoId);
    const compras = this.compraRepository.findByEventoId(evento.id);

    const estadosActivos = [
      EstadoCompra.PENDIENTE,
      EstadoCompra.CONFIRMADA,
      EstadoCompra.UTILIZADA,
    ];

    const disponibilidadPorTipo = evento.tiposEntrada.map((tipo) => {
      const entradasVendidas = compras
        .filter((c) => c.tipoEntrada.id === tipo.id && estadosActivos.includes(c.estado))
        .reduce((acc, c) => acc + c.cantidad, 0);

      return {
        ...tipo.toJSON(),
        cupoDisponible: tipo.cupo,
        entradasVendidas,
      };
    });

    return {
      evento: this.enriquecerEvento(evento),
      disponibilidadPorTipo,
      compras: compras.map((c) => c.toJSON()),
    };
  }
}
