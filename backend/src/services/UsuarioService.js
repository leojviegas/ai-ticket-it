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

  obtenerUsuarioPorId(id) {
    const usuario = this.usuarioRepository.findByIdOrThrow(id);
    const resumenOrganizador = this.reseniaService.obtenerResumenPorOrganizador(usuario.id);
    const eventosOrganizados = this.eventoRepository
      .findByOrganizadorId(usuario.id)
      .map((evento) => evento.toJSON());

    return {
      ...usuario.toJSON(),
      favoritos: usuario.favoritos.map((evento) => evento.toJSON()),
      puntajeOrganizador: resumenOrganizador.puntajeOrganizador,
      cantidadReseniasOrganizador: resumenOrganizador.cantidadResenias,
      reseniasRecibidas: resumenOrganizador.resenias,
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
