import { seedDemo } from "../../data/seeders/demoSeeder.js";
import {
  categoriaRepository,
  usuarioRepository,
  eventoRepository,
  compraRepository,
  reseniaRepository,
} from "../../src/repositories/index.js";
import { EstadoCompra } from "../../src/domain/index.js";
import { generarId } from "../../src/domain/utils/idGenerator.js";

describe("demoSeeder", () => {
  test("precarga un catálogo consistente cubriendo todos los estados y relaciones de reseñas", () => {
    seedDemo();

    expect(categoriaRepository.findAll()).toHaveLength(5);
    expect(usuarioRepository.findAll()).toHaveLength(4);

    const eventos = eventoRepository.findAll();
    expect(eventos).toHaveLength(7);
    expect(eventos.filter((e) => e.yaOcurrio())).toHaveLength(3);
    expect(eventos.filter((e) => !e.yaOcurrio())).toHaveLength(4);

    const compras = compraRepository.findAll();
    expect(compras).toHaveLength(8);

    const estadosPresentes = new Set(compras.map((c) => c.estado));
    for (const estado of [
      EstadoCompra.CONFIRMADA,
      EstadoCompra.UTILIZADA,
      EstadoCompra.CANCELADA,
      EstadoCompra.REEMBOLSADA,
    ]) {
      expect(estadosPresentes.has(estado)).toBe(true);
    }

    const resenias = reseniaRepository.findAll();
    expect(resenias).toHaveLength(4);
    for (const resenia of resenias) {
      const comprasAutor = compraRepository.findByCompradorYEvento(
        resenia.comprador.id,
        resenia.evento.id
      );
      expect(comprasAutor.some((c) => c.estado === EstadoCompra.UTILIZADA)).toBe(true);
    }
  });

  test("es idempotente y reinicia el contador autoincremental a partir de 301", () => {
    seedDemo();
    seedDemo();

    expect(categoriaRepository.findAll()).toHaveLength(5);
    expect(usuarioRepository.findAll()).toHaveLength(4);
    expect(eventoRepository.findAll()).toHaveLength(7);
    expect(compraRepository.findAll()).toHaveLength(8);
    expect(reseniaRepository.findAll()).toHaveLength(4);
    expect(generarId()).toBe(301);
  });
});
