import { Categoria } from "../../src/domain/entities/categoria.js";
import { Usuario } from "../../src/domain/entities/usuario.js";
import { TipoEntrada } from "../../src/domain/entities/tipoEntrada.js";
import { Evento } from "../../src/domain/entities/evento.js";
import { Resenia } from "../../src/domain/entities/resenia.js";
import { DomainValidationError } from "../../src/domain/errors/DomainError.js";
import { resetContadoresId } from "../../src/domain/utils/idGenerator.js";

describe("Resenia", () => {
  let organizador;
  let comprador;
  let evento;

  beforeEach(() => {
    resetContadoresId();
    organizador = new Usuario({ nombre: "Carlos", apellido: "Productor" });
    comprador = new Usuario({ nombre: "Sofía", apellido: "Compradora" });
    evento = new Evento({
      nombre: "Obra de Teatro",
      descripcion: "Comedia",
      categoria: new Categoria({ nombre: "Teatro", descripcion: "Sala" }),
      fecha: new Date("2026-10-01T20:00:00.000Z"),
      tiposEntrada: [
        new TipoEntrada({ nombre: "Platea", descripcion: "Butaca", precio: 8000, cupo: 40 }),
      ],
      organizador,
    });
  });

  test("crea una reseña válida en los bordes de puntuación 1 y 5 y la serializa", () => {
    resetContadoresId();
    const r1 = new Resenia({
      comprador,
      evento,
      detalle: "  Muy buen espectáculo  ",
      puntuacion: 1,
    });
    const r2 = new Resenia({
      comprador,
      evento,
      detalle: "Excelente",
      puntuacion: 5,
    });

    expect(r1.id).toBe(1);
    expect(r2.id).toBe(2);
    expect(r1.detalle).toBe("Muy buen espectáculo");
    expect(r1.puntuacion).toBe(1);
    expect(r2.puntuacion).toBe(5);
    expect(r1.toJSON()).toEqual({
      id: 1,
      comprador: comprador.toJSON(),
      eventoId: evento.id,
      eventoNombre: "Obra de Teatro",
      detalle: "Muy buen espectáculo",
      puntuacion: 1,
    });
  });

  test("lanza DomainValidationError ante comprador/evento faltante, detalle vacío o puntuación fuera de [1, 5]", () => {
    expect(() => new Resenia({ evento, detalle: "Bien", puntuacion: 4 })).toThrow(
      "El comprador y el evento son obligatorios para la reseña"
    );
    expect(() => new Resenia({ comprador, detalle: "Bien", puntuacion: 4 })).toThrow(
      "El comprador y el evento son obligatorios para la reseña"
    );
    expect(() => new Resenia()).toThrow(DomainValidationError);

    expect(() => new Resenia({ comprador, evento, detalle: "", puntuacion: 4 })).toThrow(
      "El comentario de la reseña es obligatorio"
    );
    expect(() => new Resenia({ comprador, evento, detalle: "   ", puntuacion: 4 })).toThrow(
      "El comentario de la reseña es obligatorio"
    );
    expect(() => new Resenia({ comprador, evento, detalle: null, puntuacion: 4 })).toThrow(
      "El comentario de la reseña es obligatorio"
    );

    expect(() => new Resenia({ comprador, evento, detalle: "Ok", puntuacion: 0.99 })).toThrow(
      "La puntuación debe ser un número entre 1 y 5"
    );
    expect(() => new Resenia({ comprador, evento, detalle: "Ok", puntuacion: 5.01 })).toThrow(
      "La puntuación debe ser un número entre 1 y 5"
    );
    expect(() => new Resenia({ comprador, evento, detalle: "Ok", puntuacion: "5" })).toThrow(
      "La puntuación debe ser un número entre 1 y 5"
    );
    expect(() => new Resenia({ comprador, evento, detalle: "Ok", puntuacion: NaN })).toThrow(
      "La puntuación debe ser un número entre 1 y 5"
    );
  });
});

