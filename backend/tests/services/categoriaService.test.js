import { seedDemo } from "../../data/seeders/demoSeeder.js";
import { categoriaRepository } from "../../src/repositories/index.js";
import { categoriaService } from "../../src/services/index.js";

describe("CategoriaService", () => {
  beforeEach(() => {
    seedDemo();
  });

  test("lista todas las categorías cargadas en memoria con su formato serializado", () => {
    const categorias = categoriaService.listarCategorias();

    expect(categorias).toHaveLength(5);
    expect(categorias.map((c) => c.nombre)).toEqual([
      "Recitales",
      "Teatro",
      "Festivales",
      "Conferencias",
      "Deportes",
    ]);
    for (const categoria of categorias) {
      expect(typeof categoria.id).toBe("number");
      expect(typeof categoria.descripcion).toBe("string");
    }
  });

  test("devuelve una lista vacía si el repositorio no contiene categorías", () => {
    categoriaRepository.clear();
    expect(categoriaService.listarCategorias()).toEqual([]);
  });
});
