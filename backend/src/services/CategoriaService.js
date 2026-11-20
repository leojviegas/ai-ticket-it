export class CategoriaService {
  constructor(categoriaRepository) {
    this.categoriaRepository = categoriaRepository;
  }

  listarCategorias() {
    return this.categoriaRepository.findAll().map((c) => c.toJSON());
  }
}
