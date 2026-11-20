import { seedDemo } from "../../data/seeders/demoSeeder.js";
import { BaseMemoryRepository } from "../../src/repositories/BaseMemoryRepository.js";
import {
  categoriaRepository,
  usuarioRepository,
  eventoRepository,
  compraRepository,
  reseniaRepository,
  clearAllRepositories,
} from "../../src/repositories/index.js";
import {
  RepositoryError,
  EntityNotFoundError,
  DuplicateEntityError,
} from "../../src/repositories/errors/RepositoryError.js";

describe("Repositories en memoria", () => {
  beforeEach(() => {
    seedDemo();
  });

  test("BaseMemoryRepository realiza CRUD en memoria y lanza EntityNotFoundError si no existe", () => {
    const repo = new BaseMemoryRepository("EntidadPrueba");
    const item = { id: 10, nombre: "Elemento" };

    expect(repo.save(item)).toBe(item);
    expect(repo.findById(10)).toBe(item);
    expect(repo.findById("10")).toBe(item);
    expect(repo.findById(999)).toBeNull();
    expect(repo.findByIdOrThrow(10)).toBe(item);
    expect(() => repo.findByIdOrThrow(999)).toThrow(EntityNotFoundError);
    expect(repo.findAll()).toEqual([item]);

    expect(repo.delete(10)).toBe(true);
    expect(repo.delete(10)).toBe(false);
    expect(repo.findAll()).toEqual([]);

    repo.save(item);
    repo.clear();
    expect(repo.findAll()).toEqual([]);
  });

  test("clearAllRepositories vacía todos los repositorios del sistema", () => {
    expect(categoriaRepository.findAll().length).toBeGreaterThan(0);
    expect(usuarioRepository.findAll().length).toBeGreaterThan(0);

    clearAllRepositories();

    expect(categoriaRepository.findAll()).toEqual([]);
    expect(usuarioRepository.findAll()).toEqual([]);
    expect(eventoRepository.findAll()).toEqual([]);
    expect(compraRepository.findAll()).toEqual([]);
    expect(reseniaRepository.findAll()).toEqual([]);
  });

  test("los repositorios especializados ejecutan sus consultas por relaciones", () => {
    const eventosLucas = eventoRepository.findByOrganizadorId(2);
    expect(eventosLucas.map((e) => e.id)).toEqual([1, 4]);

    const comprasSofia = compraRepository.findByCompradorId(1);
    expect(comprasSofia.map((c) => c.id)).toEqual([1, 5]);

    const comprasEvento1 = compraRepository.findByEventoId(1);
    expect(comprasEvento1.map((c) => c.id)).toEqual([1, 2, 9]);

    const comprasMateoEvento1 = compraRepository.findByCompradorYEvento(4, 1);
    expect(comprasMateoEvento1).toHaveLength(1);
    expect(comprasMateoEvento1[0].id).toBe(2);

    const reseniasEvento1 = reseniaRepository.findByEventoId(1);
    expect(reseniasEvento1).toHaveLength(2);

    const reseniasLucas = reseniaRepository.findByOrganizadorId(2);
    expect(reseniasLucas).toHaveLength(2);

    expect(reseniaRepository.existsByCompradorYEvento(1, 1)).toBe(true);
    expect(reseniaRepository.existsByCompradorYEvento(4, 1)).toBe(false);
  });

  test("errores de repositorio preservan nombre, mensaje y detalles", () => {
    const baseErr = new RepositoryError("Error base", { campo: "id" });
    const dupErr = new DuplicateEntityError("Entidad duplicada", { id: 1 });

    expect(baseErr.name).toBe("RepositoryError");
    expect(baseErr.details).toEqual({ campo: "id" });
    expect(dupErr).toBeInstanceOf(RepositoryError);
    expect(dupErr.name).toBe("DuplicateEntityError");
    expect(dupErr.details).toEqual({ id: 1 });
  });
});
