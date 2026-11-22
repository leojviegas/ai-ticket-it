import { Usuario } from "../../src/domain/entities/usuario.js";
import { DomainValidationError } from "../../src/domain/errors/DomainError.js";
import { resetContadoresId } from "../../src/domain/utils/idGenerator.js";

describe("Usuario", () => {
  beforeEach(() => {
    resetContadoresId();
  });

  test("crea un usuario válido con id autoincremental, recorta espacios y favoritos vacío por defecto", () => {
    const u1 = new Usuario({ nombre: "  Ana  ", apellido: "  Gómez  " });
    const u2 = new Usuario({ nombre: "Luis", apellido: "Pérez" });

    expect(u1.id).toBe(1);
    expect(u2.id).toBe(2);
    expect(u1.email).toBeNull();
    expect(u1.passwordHash).toBeNull();
    expect(u1.favoritos).toEqual([]);
    expect(u1.toJSON()).toEqual({
      id: 1,
      nombre: "Ana",
      apellido: "Gómez",
      email: null,
      favoritosIds: [],
    });
  });

  test("permite asignar email y passwordHash sin exponer passwordHash en toJSON", () => {
    const usuario = new Usuario({
      nombre: "Carlos",
      apellido: "Ruiz",
      email: "carlos@example.com",
      passwordHash: "$2b$10$hashficticio",
    });

    expect(usuario.email).toBe("carlos@example.com");
    expect(usuario.passwordHash).toBe("$2b$10$hashficticio");
    const json = usuario.toJSON();
    expect(json).toEqual({
      id: 1,
      nombre: "Carlos",
      apellido: "Ruiz",
      email: "carlos@example.com",
      favoritosIds: [],
    });
    expect(json.passwordHash).toBeUndefined();
  });

  test("lanza DomainValidationError si falta nombre o apellido", () => {
    expect(() => new Usuario({ apellido: "Gómez" })).toThrow(DomainValidationError);
    expect(() => new Usuario({ apellido: "Gómez" })).toThrow(
      "El nombre y el apellido del usuario son obligatorios"
    );
    expect(() => new Usuario({ nombre: "Ana" })).toThrow(
      "El nombre y el apellido del usuario son obligatorios"
    );
    expect(() => new Usuario({ nombre: "   ", apellido: "Gómez" })).toThrow(
      "El nombre y el apellido del usuario son obligatorios"
    );
    expect(() => new Usuario({ nombre: "Ana", apellido: "   " })).toThrow(
      "El nombre y el apellido del usuario son obligatorios"
    );
    expect(() => new Usuario({ nombre: 123, apellido: "Gómez" })).toThrow(
      "El nombre y el apellido del usuario son obligatorios"
    );
    expect(() => new Usuario({ nombre: "Ana", apellido: 123 })).toThrow(
      "El nombre y el apellido del usuario son obligatorios"
    );
    expect(() => new Usuario({})).toThrow("El nombre y el apellido del usuario son obligatorios");
    expect(() => new Usuario()).toThrow("El nombre y el apellido del usuario son obligatorios");
  });

  test("permite agregar, consultar y quitar eventos favoritos sin duplicarlos", () => {
    const usuario = new Usuario({ nombre: "Ana", apellido: "Gómez" });
    const evento1 = { id: 10, nombre: "Concierto 1" };
    const evento2 = { id: 20, nombre: "Concierto 2" };

    expect(() => usuario.agregarFavorito(null)).toThrow(
      "El evento es obligatorio para agregarlo a favoritos"
    );

    usuario.agregarFavorito(evento1);
    usuario.agregarFavorito(evento1); // no debe duplicar
    usuario.agregarFavorito(evento2);

    expect(usuario.esFavorito(10)).toBe(true);
    expect(usuario.esFavorito(20)).toBe(true);
    expect(usuario.esFavorito(999)).toBe(false);
    expect(usuario.favoritos).toHaveLength(2);
    expect(usuario.toJSON().favoritosIds).toEqual([10, 20]);

    usuario.quitarFavorito(10);
    expect(usuario.esFavorito(10)).toBe(false);
    expect(usuario.esFavorito(20)).toBe(true);
    expect(usuario.favoritos).toEqual([evento2]);
  });
});

