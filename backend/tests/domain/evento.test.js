import { Categoria } from "../../src/domain/entities/categoria.js";
import { Usuario } from "../../src/domain/entities/usuario.js";
import { TipoEntrada } from "../../src/domain/entities/tipoEntrada.js";
import { Evento } from "../../src/domain/entities/evento.js";
import { DomainValidationError } from "../../src/domain/errors/DomainError.js";
import { resetContadoresId } from "../../src/domain/utils/idGenerator.js";

describe("Evento", () => {
  let categoria;
  let organizador;
  let entradaGeneral;
  let entradaVip;

  beforeEach(() => {
    resetContadoresId();
    categoria = new Categoria({ nombre: "Recitales", descripcion: "Shows en vivo" });
    organizador = new Usuario({ nombre: "Carlos", apellido: "Solari" });
    entradaGeneral = new TipoEntrada({
      nombre: "General",
      descripcion: "Campo",
      precio: 10000,
      cupo: 100,
    });
    entradaVip = new TipoEntrada({
      nombre: "VIP",
      descripcion: "Palco",
      precio: 25000,
      cupo: 20,
    });
  });

  test("crea un evento válido con Date o string ISO y valores por defecto", () => {
    resetContadoresId();
    const fechaDate = new Date("2026-12-20T21:00:00.000Z");
    const evento = new Evento({
      nombre: "Noche de Rock",
      descripcion: "Recital acústico",
      categoria,
      fecha: "2026-12-20T21:00:00.000Z",
      tiposEntrada: [entradaVip, entradaGeneral],
      organizador,
    });

    expect(evento.id).toBe(1);
    expect(evento.fecha).toEqual(fechaDate);
    expect(evento.multimedia).toEqual([]);
    expect(evento.obtenerPrecioMinimo()).toBe(10000);
    expect(evento.toJSON()).toEqual({
      id: 1,
      nombre: "Noche de Rock",
      descripcion: "Recital acústico",
      categoria: categoria.toJSON(),
      fecha: fechaDate,
      tiposEntrada: [entradaVip.toJSON(), entradaGeneral.toJSON()],
      multimedia: [],
      organizador: organizador.toJSON(),
      precioMinimo: 10000,
    });
  });

  test("acepta una instancia de Date directamente", () => {
    const fecha = new Date("2026-12-20T21:00:00.000Z");
    const evento = new Evento({
      nombre: "Show",
      descripcion: "Desc",
      categoria,
      fecha,
      tiposEntrada: [entradaGeneral],
      organizador,
    });
    expect(evento.fecha).toBe(fecha);
  });

  test("lanza DomainValidationError si faltan datos obligatorios, fecha inválida o sin tiposEntrada", () => {
    const base = {
      nombre: "Show",
      descripcion: "Desc",
      categoria,
      fecha: new Date("2026-12-20T21:00:00.000Z"),
      tiposEntrada: [entradaGeneral],
      organizador,
    };

    expect(() => new Evento({ ...base, nombre: "" })).toThrow(
      "Faltan datos obligatorios para el evento"
    );
    expect(() => new Evento({ ...base, descripcion: "" })).toThrow(
      "Faltan datos obligatorios para el evento"
    );
    expect(() => new Evento({ ...base, categoria: null })).toThrow(
      "Faltan datos obligatorios para el evento"
    );
    expect(() => new Evento({ ...base, organizador: null })).toThrow(
      "Faltan datos obligatorios para el evento"
    );
    expect(() => new Evento({ ...base, fecha: null })).toThrow(
      "Faltan datos obligatorios para el evento"
    );
    expect(() => new Evento()).toThrow("Faltan datos obligatorios para el evento");

    expect(() => new Evento({ ...base, fecha: "fecha-invalida" })).toThrow(
      "La fecha del evento no es válida"
    );
    expect(() => new Evento({ ...base, tiposEntrada: [] })).toThrow(
      "El evento debe tener al menos un tipo de entrada"
    );
    expect(() => new Evento({ ...base, tiposEntrada: undefined })).toThrow(
      "El evento debe tener al menos un tipo de entrada"
    );
    expect(() => new Evento({ ...base, tiposEntrada: null })).toThrow(
      "El evento debe tener al menos un tipo de entrada"
    );
  });

  test("tuPrecioEstaEntre evalúa correctamente los límites inclusivos min y max", () => {
    const evento = new Evento({
      nombre: "Show",
      descripcion: "Desc",
      categoria,
      fecha: new Date("2026-12-20T21:00:00.000Z"),
      tiposEntrada: [entradaGeneral, entradaVip], // 10000 y 25000
      organizador,
    });

    expect(evento.tuPrecioEstaEntre(10000, 10000)).toBe(true);
    expect(evento.tuPrecioEstaEntre(5000, 10000)).toBe(true);
    expect(evento.tuPrecioEstaEntre(25000, 30000)).toBe(true);
    expect(evento.tuPrecioEstaEntre(10001, 24999)).toBe(false);
    expect(evento.tuPrecioEstaEntre(0, 9999)).toBe(false);
    expect(evento.tuPrecioEstaEntre(25001, 50000)).toBe(false);
  });

  test("yaOcurrio verifica si la fecha del evento es menor o igual a la fecha de referencia", () => {
    const fechaEvento = new Date("2026-11-10T20:00:00.000Z");
    const evento = new Evento({
      nombre: "Show",
      descripcion: "Desc",
      categoria,
      fecha: fechaEvento,
      tiposEntrada: [entradaGeneral],
      organizador,
    });

    expect(evento.yaOcurrio(new Date("2026-11-10T19:59:59.000Z"))).toBe(false);
    expect(evento.yaOcurrio(new Date("2026-11-10T20:00:00.000Z"))).toBe(true);
    expect(evento.yaOcurrio(new Date("2026-11-11T00:00:00.000Z"))).toBe(true);
  });
});

