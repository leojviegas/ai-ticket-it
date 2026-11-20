export class UsuarioService {
  constructor({ usuarioRepository, eventoRepository, reseniaService }) {
    this.usuarioRepository = usuarioRepository;
    this.eventoRepository = eventoRepository;
    this.reseniaService = reseniaService;
  }

  listarUsuarios() {
    return this.usuarioRepository.findAll().map((usuario) => {
      const { puntajeOrganizador, cantidadReseniasOrganizador } =
        this.reseniaService.calcularPuntajeOrganizador(usuario.id);
      return {
        ...usuario.toJSON(),
        puntajeOrganizador,
        cantidadReseniasOrganizador,
      };
    });
  }

  enriquecerEvento(evento) {
    const { puntajeEvento, cantidadReseniasEvento } =
      this.reseniaService.obtenerResumenPorEvento(evento.id);
    const { puntajeOrganizador, cantidadReseniasOrganizador } =
      this.reseniaService.calcularPuntajeOrganizador(evento.organizador.id);

    return {
      ...evento.toJSON(),
      yaOcurrio: evento.yaOcurrio(),
      puntajeEvento,
      cantidadReseniasEvento,
      puntajeOrganizador,
      cantidadReseniasOrganizador,
    };
  }

  obtenerUsuarioPorId(id) {
    const usuario = this.usuarioRepository.findByIdOrThrow(id);
    const resumenOrganizador = this.reseniaService.obtenerResumenPorOrganizador(usuario.id);
    const eventosOrganizados = this.eventoRepository
      .findByOrganizadorId(usuario.id)
      .map((evento) => this.enriquecerEvento(evento));

    return {
      ...usuario.toJSON(),
      favoritos: usuario.favoritos.map((evento) => this.enriquecerEvento(evento)),
      puntajeOrganizador: resumenOrganizador.puntajeOrganizador,
      cantidadReseniasOrganizador: resumenOrganizador.cantidadResenias,
      reseniasRecibidas: resumenOrganizador.resenias,
      reseniasOrganizador: resumenOrganizador.resenias,
      eventosOrganizados,
    };
  }

  toggleFavorito(usuarioId, eventoId) {
    const usuario = this.usuarioRepository.findByIdOrThrow(usuarioId);
    const evento = this.eventoRepository.findByIdOrThrow(eventoId);

    let esFavorito;
    if (usuario.esFavorito(evento.id)) {
      usuario.quitarFavorito(evento.id);
      esFavorito = false;
    } else {
      usuario.agregarFavorito(evento);
      esFavorito = true;
    }

    return {
      esFavorito,
      favoritosIds: usuario.favoritos.map((e) => e.id),
      usuario: usuario.toJSON(),
    };
  }
}
