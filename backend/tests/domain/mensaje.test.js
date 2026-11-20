import { Usuario } from "../../src/domain/entities/usuario.js";
import { Mensaje } from "../../src/domain/entities/mensaje.js";
import { DomainValidationError } from "../../src/domain/errors/DomainError.js";
import { resetContadoresId } from "../../src/domain/utils/idGenerator.js";

describe("Mensaje", () => {
  let usuario;

  beforeEach(() => {
    resetContadoresId();
    usuario = new Usuario({ nombre: "Sofía", apellido: "Martínez" });
  });

  test("crea un mensaje válido, recorta espacios y usa fecha actual por defecto", () => {
    resetContadoresId();
    const m = new Mensaje({ usuario, mensaje: "  Hola, ¿hay estacionamiento?  " });

    expect(m.id).toBe(1);
    expect(m.mensaje).toBe("Hola, ¿hay estacionamiento?");
    expect(m.enviado).toBeInstanceOf(Date);
    expect(m.toJSON()).toEqual({
      id: 1,
      usuario: usuario.toJSON(),
      mensaje: "Hola, ¿hay estacionamiento?",
      enviado: m.enviado,
    });
  });

  test("lanza DomainValidationError si falta el usuario o el mensaje está vacío", () => {
    expect(() => new Mensaje({ mensaje: "Hola" })).toThrow(
      "El usuario emisor del mensaje es obligatorio"
    );
    expect(() => new Mensaje({ usuario, mensaje: "" })).toThrow(
      "El contenido del mensaje no puede estar vacío"
    );
    expect(() => new Mensaje({ usuario, mensaje: "   " })).toThrow(
      "El contenido del mensaje no puede estar vacío"
    );
    expect(() => new Mensaje({ usuario, mensaje: 123 })).toThrow(
      "El contenido del mensaje no puede estar vacío"
    );
    expect(() => new Mensaje()).toThrow(DomainValidationError);
  });
});

