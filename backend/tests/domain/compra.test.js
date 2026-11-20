import { Categoria } from "../../src/domain/entities/categoria.js";
import { Usuario } from "../../src/domain/entities/usuario.js";
import { TipoEntrada } from "../../src/domain/entities/tipoEntrada.js";
import { Evento } from "../../src/domain/entities/evento.js";
import { Compra } from "../../src/domain/entities/compra.js";
import { CambioEstadoCompra } from "../../src/domain/entities/cambioEstadoCompra.js";
import { EstadoCompra } from "../../src/domain/enums/estadoCompra.js";
import {
  DomainValidationError,
  InvalidStateTransitionError,
} from "../../src/domain/errors/DomainError.js";
import { resetContadoresId } from "../../src/domain/utils/idGenerator.js";

describe("Compra", () => {
  let organizador;
  let comprador;
  let tercero;
  let categoria;
  let tipoEntrada;
  let eventoFuturo;

  beforeEach(() => {
    resetContadoresId();
    organizador = new Usuario({ nombre: "Carlos", apellido: "Productor" });
    comprador = new Usuario({ nombre: "Sofía", apellido: "Compradora" });
    tercero = new Usuario({ nombre: "Pedro", apellido: "Intruso" });
    categoria = new Categoria({ nombre: "Recitales", descripcion: "Música" });
    tipoEntrada = new TipoEntrada({
      nombre: "General",
      descripcion: "Campo",
      precio: 15000,
      cupo: 50,
    });
    eventoFuturo = new Evento({
      nombre: "Rock Fest",
      descripcion: "Gran festival",
      categoria,
      fecha: new Date("2026-11-10T20:00:00.000Z"),
      tiposEntrada: [tipoEntrada],
      organizador,
    });
  });

  test("crea una compra en estado PENDIENTE por defecto, calcula el total y registra el cambio de estado inicial", () => {
    resetContadoresId();
    const compra = new Compra({
      comprador,
      evento: eventoFuturo,
      tipoEntrada,
      cantidad: 2,
    });

    expect(compra.id).toBe(1);
    expect(compra.estado).toBe(EstadoCompra.PENDIENTE);
    expect(compra.total).toBe(30000);
    expect(compra.mensajes).toEqual([]);
    expect(compra.cambiosEstado).toHaveLength(1);
    expect(compra.cambiosEstado[0].estado).toBe(EstadoCompra.PENDIENTE);
    expect(compra.cambiosEstado[0].quien).toBe(comprador);
    expect(compra.calcularDiasParaEvento(new Date("2026-11-05T20:00:00.000Z"))).toBeNull();
  });

  test("respeta total explícito y cambiosEstado previos si se suministran", () => {
    const cambioPrevio = new CambioEstadoCompra({
      compra: { id: 99 },
      estado: EstadoCompra.CONFIRMADA,
      quien: organizador,
    });
    const compra = new Compra({
      id: 99,
      comprador,
      evento: eventoFuturo,
      tipoEntrada,
      cantidad: 2,
      total: 25000,
      estado: EstadoCompra.CONFIRMADA,
      cambiosEstado: [cambioPrevio],
    });

    expect(compra.total).toBe(25000);
    expect(compra.cambiosEstado).toEqual([cambioPrevio]);
  });

  test("lanza DomainValidationError ante datos faltantes, cantidad inválida o estado inválido", () => {
    const cambioPrevio = new CambioEstadoCompra({
      compra: { id: 99 },
      estado: EstadoCompra.CONFIRMADA,
      quien: organizador,
    });

    expect(() => new Compra({ evento: eventoFuturo, tipoEntrada, cantidad: 1 })).toThrow(
      "Faltan datos obligatorios para la compra"
    );
    expect(() => new Compra({ comprador, tipoEntrada, cantidad: 1 })).toThrow(
      "Faltan datos obligatorios para la compra"
    );
    expect(() => new Compra({ comprador, evento: eventoFuturo, cantidad: 1 })).toThrow(
      "Faltan datos obligatorios para la compra"
    );
    expect(() => new Compra()).toThrow("Faltan datos obligatorios para la compra");

    expect(
      () => new Compra({ comprador, evento: eventoFuturo, tipoEntrada, cantidad: 0 })
    ).toThrow("La cantidad de entradas debe ser un entero mayor a 0");
    expect(
      () => new Compra({ comprador, evento: eventoFuturo, tipoEntrada, cantidad: -1 })
    ).toThrow("La cantidad de entradas debe ser un entero mayor a 0");
    expect(
      () => new Compra({ comprador, evento: eventoFuturo, tipoEntrada, cantidad: 1.5 })
    ).toThrow("La cantidad de entradas debe ser un entero mayor a 0");

    expect(
      () =>
        new Compra({
          comprador,
          evento: eventoFuturo,
          tipoEntrada,
          cantidad: 1,
          estado: "INVALIDO",
          cambiosEstado: [cambioPrevio],
        })
    ).toThrow("Estado de compra inválido: INVALIDO");
  });

  test("actualizarEstado permite el flujo PENDIENTE -> CONFIRMADA -> UTILIZADA y bloquea transiciones inválidas", () => {
    const compra = new Compra({
      comprador,
      evento: eventoFuturo,
      tipoEntrada,
      cantidad: 1,
    });

    expect(() => compra.actualizarEstado("CUALQUIERA")).toThrow(
      "Estado de compra inválido: CUALQUIERA"
    );
    expect(() => compra.actualizarEstado(EstadoCompra.UTILIZADA)).toThrow(
      InvalidStateTransitionError
    );
    expect(() => compra.actualizarEstado(EstadoCompra.REEMBOLSADA)).toThrow(
      "No se puede cambiar el estado de la compra de PENDIENTE a REEMBOLSADA"
    );

    compra.actualizarEstado(EstadoCompra.CONFIRMADA, organizador);
    expect(compra.estado).toBe(EstadoCompra.CONFIRMADA);
    expect(compra.cambiosEstado).toHaveLength(2);
    expect(compra.cambiosEstado[1].quien).toBe(organizador);

    expect(() => compra.actualizarEstado(EstadoCompra.PENDIENTE)).toThrow(
      InvalidStateTransitionError
    );

    compra.actualizarEstado(EstadoCompra.UTILIZADA, organizador);
    expect(compra.estado).toBe(EstadoCompra.UTILIZADA);
    expect(compra.cambiosEstado).toHaveLength(3);

    expect(() => compra.actualizarEstado(EstadoCompra.CANCELADA)).toThrow(
      InvalidStateTransitionError
    );
  });

  test("cancelar y reembolsar funcionan en 2 pasos, restituyen cupo y validan estado y fecha del evento", () => {
    tipoEntrada.descontarCupo(3);
    expect(tipoEntrada.cupo).toBe(47);

    const compra = new Compra({
      comprador,
      evento: eventoFuturo,
      tipoEntrada,
      cantidad: 3,
    });

    compra.actualizarEstado(EstadoCompra.CONFIRMADA, organizador);

    // No se puede cancelar si el evento ya ocurrió
    expect(() =>
      compra.cancelar(comprador, new Date("2026-11-10T20:00:00.000Z"))
    ).toThrow("No se puede cancelar una compra de un evento que ya se realizó");

    // Cancelación válida antes del evento
    compra.cancelar(comprador, new Date("2026-11-01T12:00:00.000Z"));
    expect(compra.estado).toBe(EstadoCompra.CANCELADA);
    expect(tipoEntrada.cupo).toBe(50);

    // El organizador reembolsa la compra cancelada
    compra.reembolsar(organizador, new Date("2026-11-01T15:00:00.000Z"));
    expect(compra.estado).toBe(EstadoCompra.REEMBOLSADA);

    // Una compra reembolsada no admite más cambios
    expect(() => compra.reembolsar(organizador)).toThrow(InvalidStateTransitionError);
  });

  test("cancelar lanza InvalidStateTransitionError si la compra ya está CANCELADA o REEMBOLSADA incluso en evento pasado", () => {
    const compraCancelada = new Compra({
      comprador,
      evento: eventoFuturo,
      tipoEntrada,
      cantidad: 1,
      estado: EstadoCompra.CANCELADA,
    });
    expect(() =>
      compraCancelada.cancelar(comprador, new Date("2026-11-12T20:00:00.000Z"))
    ).toThrow("No se puede cambiar el estado de la compra de CANCELADA a CANCELADA");

    const compraReembolsada = new Compra({
      comprador,
      evento: eventoFuturo,
      tipoEntrada,
      cantidad: 1,
      estado: EstadoCompra.REEMBOLSADA,
    });
    expect(() =>
      compraReembolsada.cancelar(comprador, new Date("2026-11-12T20:00:00.000Z"))
    ).toThrow("No se puede cambiar el estado de la compra de REEMBOLSADA a CANCELADA");
  });

  test("cancelar lanza InvalidStateTransitionError si la compra ya fue UTILIZADA", () => {
    const compra = new Compra({
      comprador,
      evento: eventoFuturo,
      tipoEntrada,
      cantidad: 1,
      estado: EstadoCompra.UTILIZADA,
    });

    expect(() =>
      compra.cancelar(comprador, new Date("2026-11-01T10:00:00.000Z"))
    ).toThrow("No se puede cancelar una compra que ya fue utilizada");
  });

  test("calcularDiasParaEvento calcula los días solo en estado CONFIRMADA", () => {
    const compra = new Compra({
      comprador,
      evento: eventoFuturo, // 2026-11-10T20:00:00.000Z
      tipoEntrada,
      cantidad: 1,
      estado: EstadoCompra.CONFIRMADA,
    });

    // Faltan exactamente 5 días
    expect(compra.calcularDiasParaEvento(new Date("2026-11-05T20:00:00.000Z"))).toBe(5);
    //Si la fecha ya pasó pero sigue confirmada, devuelve 0 (no negativo)
    expect(compra.calcularDiasParaEvento(new Date("2026-11-12T20:00:00.000Z"))).toBe(0);
  });

  test("agregarMensaje permite chatear a comprador y organizador y rechaza a terceros", () => {
    const compra = new Compra({
      comprador,
      evento: eventoFuturo,
      tipoEntrada,
      cantidad: 1,
    });

    const msgComprador = compra.agregarMensaje(comprador, "Hola, tengo una duda");
    const msgOrganizador = compra.agregarMensaje(organizador, "Hola Sofía, decime");

    expect(compra.mensajes).toHaveLength(2);
    expect(msgComprador.mensaje).toBe("Hola, tengo una duda");
    expect(msgOrganizador.usuario).toBe(organizador);

    expect(() => compra.agregarMensaje(null, "Hola")).toThrow(
      "El usuario emisor del mensaje es obligatorio"
    );
    expect(() => compra.agregarMensaje(tercero, "Soy un intruso")).toThrow(
      "Solo el comprador o el organizador del evento pueden enviar mensajes en esta compra"
    );

    const json = compra.toJSON(new Date("2026-11-05T20:00:00.000Z"));
    expect(json.mensajes).toEqual([msgComprador.toJSON(), msgOrganizador.toJSON()]);
    expect(json.cambiosEstado).toEqual([compra.cambiosEstado[0].toJSON()]);
  });
});

