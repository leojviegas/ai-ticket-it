import { seedDemo } from "../../data/seeders/demoSeeder.js";
import { compraService, eventoService } from "../../src/services/index.js";
import { EstadoCompra } from "../../src/domain/index.js";
import {
  DomainValidationError,
  InvalidStateTransitionError,
} from "../../src/domain/errors/DomainError.js";
import { BusinessRuleError } from "../../src/services/errors/ServiceError.js";

describe("CompraService", () => {
  beforeEach(() => {
    seedDemo();
  });

  test("crea compra en estado PENDIENTE descontando cupo y rechaza si supera cupo disponible", () => {
    const compra = compraService.crearCompra({
      compradorId: 4, // Mateo
      eventoId: 4, // Festival Indie Primavera (Lucas)
      tipoEntradaId: 202, // VIP Lounge (cupo 25)
      cantidad: 5,
    });

    expect(compra.estado).toBe(EstadoCompra.PENDIENTE);
    expect(compra.total).toBe(48000 * 5);
    expect(compra.diasParaEvento).toBeNull();

    const detalle = eventoService.obtenerEventoDetalle(4);
    const vip = detalle.tiposEntrada.find((t) => t.id === 202);
    expect(vip.cupo).toBe(20);

    expect(() =>
      compraService.crearCompra({
        compradorId: 4,
        eventoId: 4,
        tipoEntradaId: 202,
        cantidad: 21,
      })
    ).toThrow(DomainValidationError);
  });

  test("ADR 002 DUDA-01: si el comprador cancela una compra PENDIENTE, el intento posterior del organizador de confirmarla lanza 409 (InvalidStateTransitionError)", () => {
    // Compra 6: Mateo (4) en evento 5 de Sofía (1), estado PENDIENTE
    const cancelada = compraService.cancelarCompra(6, { usuarioId: 4 });
    expect(cancelada.estado).toBe(EstadoCompra.CANCELADA);

    expect(() =>
      compraService.actualizarEstado(6, {
        estado: EstadoCompra.CONFIRMADA,
        usuarioId: 1,
      })
    ).toThrow(InvalidStateTransitionError);

    // El organizador (Sofía, id 1) sí puede pasarla a REEMBOLSADA
    const reembolsada = compraService.reembolsarCompra(6, { usuarioId: 1 });
    expect(reembolsada.estado).toBe(EstadoCompra.REEMBOLSADA);
  });

  test("ADR 002 DUDA-06 (Opción A): el organizador puede cancelar una compra PENDIENTE, pero no una CONFIRMADA", () => {
    // Compra 6 está PENDIENTE y su organizadora es Sofía (1)
    const canceladaPorOrg = compraService.cancelarCompra(6, { usuarioId: 1 });
    expect(canceladaPorOrg.estado).toBe(EstadoCompra.CANCELADA);
    expect(canceladaPorOrg.cambiosEstado.at(-1).quien.id).toBe(1);

    // Compra 5 está CONFIRMADA (comprador Sofía 1, organizador Lucas 2)
    expect(() => compraService.cancelarCompra(5, { usuarioId: 2 })).toThrow(BusinessRuleError);
    expect(() => compraService.cancelarCompra(5, { usuarioId: 2 })).toThrow(
      "Solo el comprador puede cancelar una compra confirmada"
    );

    // Un tercero (Mateo 4) tampoco puede cancelar compra 5
    expect(() => compraService.cancelarCompra(5, { usuarioId: 4 })).toThrow(BusinessRuleError);

    // El comprador (Sofía 1) sí puede cancelar su compra CONFIRMADA en evento futuro
    const canceladaPorComp = compraService.cancelarCompra(5, { usuarioId: 1 });
    expect(canceladaPorComp.estado).toBe(EstadoCompra.CANCELADA);
  });

  test("permite al comprador y al organizador intercambiar mensajes en el chat en cualquier estado", () => {
    const res1 = compraService.agregarMensaje(7, {
      usuarioId: 3, // Valentina (compradora de compra 7 CANCELADA)
      mensaje: "Hola Lucas, ¿cuándo se acredita el reembolso?",
    });
    expect(res1.mensaje.mensaje).toBe("Hola Lucas, ¿cuándo se acredita el reembolso?");

    const res2 = compraService.agregarMensaje(7, {
      usuarioId: 2, // Lucas (organizador)
      mensaje: "Hoy mismo lo proceso desde el panel.",
    });
    expect(res2.compra.mensajes).toHaveLength(2);
  });
});
