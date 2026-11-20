export class CategoriaController {
  constructor(categoriaService) {
    this.categoriaService = categoriaService;
  }

  listar = (req, res) => {
    const categorias = this.categoriaService.listarCategorias();
    res.json(categorias);
  };
}
