import { TipoEntrada } from "../../src/domain/entities/tipoEntrada.js";
import { DomainValidationError } from "../../src/domain/errors/DomainError.js";
import { resetContadoresId } from "../../src/domain/utils/idGenerator.js";

describe("TipoEntrada", () => {
  beforeEach(() => {
    resetContadoresId();
  });

  test("crea un TipoEntrada válido incluso con precio 0 y cupo 0 y recorta espacios", () => {
    const gratuita = new TipoEntrada({
      nombre: "  General Gratis  ",
      descripcion: "  Entrada libre  ",
      precio: 0,
      cupo: 0,
    });

    expect(gratuita.id).toBe(1);
    expect(gratuita.toJSON()).toEqual({
      id: 1,
      nombre: "General Gratis",
      descripcion: "Entrada libre",
      precio: 0,
      cupo: 0,
    });
  });

  test("lanza DomainValidationError ante datos faltantes, precio inválido o cupo inválido", () => {
    expect(() => new TipoEntrada({ descripcion: "Desc", precio: 100, cupo: 10 })).toThrow(
      "El nombre y la descripción del tipo de entrada son obligatorios"
    );
    expect(() => new TipoEntrada({ nombre: "VIP", precio: 100, cupo: 10 })).toThrow(
      "El nombre y la descripción del tipo de entrada son obligatorios"
    );
    expect(() => new TipoEntrada({ nombre: "   ", descripcion: "Desc", precio: 100, cupo: 10 })).toThrow(
      "El nombre y la descripción del tipo de entrada son obligatorios"
    );
    expect(() => new TipoEntrada({ nombre: "VIP", descripcion: "   ", precio: 100, cupo: 10 })).toThrow(
      "El nombre y la descripción del tipo de entrada son obligatorios"
    );
    expect(() => new TipoEntrada({ nombre: 123, descripcion: "Desc", precio: 100, cupo: 10 })).toThrow(
      "El nombre y la descripción del tipo de entrada son obligatorios"
    );
    expect(() => new TipoEntrada({ nombre: "VIP", descripcion: 123, precio: 100, cupo: 10 })).toThrow(
      "El nombre y la descripción del tipo de entrada son obligatorios"
    );
    expect(() => new TipoEntrada()).toThrow(DomainValidationError);

    expect(() => new TipoEntrada({ nombre: "VIP", descripcion: "Desc", precio: -1, cupo: 10 })).toThrow(
      "El precio debe ser un número mayor o igual a 0"
    );
    expect(() => new TipoEntrada({ nombre: "VIP", descripcion: "Desc", precio: "100", cupo: 10 })).toThrow(
      "El precio debe ser un número mayor o igual a 0"
    );
    expect(() => new TipoEntrada({ nombre: "VIP", descripcion: "Desc", precio: NaN, cupo: 10 })).toThrow(
      "El precio debe ser un número mayor o igual a 0"
    );

    expect(() => new TipoEntrada({ nombre: "VIP", descripcion: "Desc", precio: 100, cupo: -1 })).toThrow(
      "El cupo debe ser un entero mayor o igual a 0"
    );
    expect(() => new TipoEntrada({ nombre: "VIP", descripcion: "Desc", precio: 100, cupo: 2.5 })).toThrow(
      "El cupo debe ser un entero mayor o igual a 0"
    );
  });

  test("hayCupoPara verifica bordes de cantidad y disponibilidad", () => {
    const entrada = new TipoEntrada({
      nombre: "Platea",
      descripcion: "Asiento numerado",
      precio: 5000,
      cupo: 5,
    });

    expect(entrada.hayCupoPara(1)).toBe(true);
    expect(entrada.hayCupoPara(5)).toBe(true);
    expect(entrada.hayCupoPara(6)).toBe(false);
    expect(entrada.hayCupoPara(0)).toBe(false);
    expect(entrada.hayCupoPara(-2)).toBe(false);
    expect(entrada.hayCupoPara(1.5)).toBe(false);
  });

  test("descontarCupo y restituirCupo actualizan el cupo y validan bordes", () => {
    const entrada = new TipoEntrada({
      nombre: "Campo",
      descripcion: "De pie",
      precio: 3000,
      cupo: 5,
    });

    entrada.descontarCupo(3);
    expect(entrada.cupo).toBe(2);

    entrada.descontarCupo(2);
    expect(entrada.cupo).toBe(0);

    expect(() => entrada.descontarCupo(1)).toThrow(
      "No hay cupo suficiente para la cantidad solicitada (disponible: 0)"
    );
    expect(() => entrada.descontarCupo(0)).toThrow(
      "No hay cupo suficiente para la cantidad solicitada (disponible: 0)"
    );

    entrada.restituirCupo(4);
    expect(entrada.cupo).toBe(4);

    expect(() => entrada.restituirCupo(0)).toThrow(
      "La cantidad a restituir debe ser un entero positivo"
    );
    expect(() => entrada.restituirCupo(-1)).toThrow(
      "La cantidad a restituir debe ser un entero positivo"
    );
    expect(() => entrada.restituirCupo(1.5)).toThrow(
      "La cantidad a restituir debe ser un entero positivo"
    );
  });
});

