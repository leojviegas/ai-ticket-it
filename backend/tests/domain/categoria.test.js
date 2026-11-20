import { Categoria } from "../../src/domain/entities/categoria.js";
import { DomainValidationError } from "../../src/domain/errors/DomainError.js";
import { resetContadoresId } from "../../src/domain/utils/idGenerator.js";

describe("Categoria", () => {
  beforeEach(() => {
    resetContadoresId();
  });

  test("crea una categoría válida con id autoincremental y la serializa a JSON", () => {
    const c1 = new Categoria({ nombre: "Recitales", descripcion: "Música en vivo" });
    const c2 = new Categoria({ nombre: "Teatro", descripcion: "Obras teatrales" });

    expect(c1.id).toBe(1);
    expect(c2.id).toBe(2);
    expect(c1.toJSON()).toEqual({
      id: 1,
      nombre: "Recitales",
      descripcion: "Música en vivo",
    });
  });

  test("permite especificar un id explícito", () => {
    const cat = new Categoria({ id: 99, nombre: "Deportes", descripcion: "Torneos" });
    expect(cat.id).toBe(99);
  });

  test("lanza DomainValidationError si falta el nombre o la descripción", () => {
    expect(() => new Categoria({ descripcion: "Música" })).toThrow(DomainValidationError);
    expect(() => new Categoria({ descripcion: "Música" })).toThrow(
      "El nombre y la descripción de la categoría son obligatorios"
    );
    expect(() => new Categoria({ nombre: "Recitales" })).toThrow(
      "El nombre y la descripción de la categoría son obligatorios"
    );
    expect(() => new Categoria({})).toThrow(
      "El nombre y la descripción de la categoría son obligatorios"
    );
    expect(() => new Categoria()).toThrow(
      "El nombre y la descripción de la categoría son obligatorios"
    );
  });
});

