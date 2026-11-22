import { seedDemo } from "../../data/seeders/demoSeeder.js";
import { compraService, eventoService, reseniaService } from "../../src/services/index.js";
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

  test("ADR 005: el organizador puede cancelar compras PENDIENTE y CONFIRMADA antes del evento, rechazando terceros", () => {
    // Compra 6 está PENDIENTE y su organizadora es Sofía (1)
    const canceladaPorOrg = compraService.cancelarCompra(6, { usuarioId: 1 });
    expect(canceladaPorOrg.estado).toBe(EstadoCompra.CANCELADA);
    expect(canceladaPorOrg.cambiosEstado.at(-1).quien.id).toBe(1);

    // Tercero (Mateo 4) no puede cancelar compra 5
    expect(() => compraService.cancelarCompra(5, { usuarioId: 4 })).toThrow(BusinessRuleError);

    // Compra 5 está CONFIRMADA (compradora Sofía 1, organizador Lucas 2): Lucas puede cancelarla y restituye cupo
    const cupoAntes = eventoService
      .obtenerEventoDetalle(4)
      .tiposEntrada.find((t) => t.id === 201).cupo;
    const canceladaConfirmadaPorOrg = compraService.cancelarCompra(5, { usuarioId: 2 });
    expect(canceladaConfirmadaPorOrg.estado).toBe(EstadoCompra.CANCELADA);
    expect(canceladaConfirmadaPorOrg.cambiosEstado.at(-1).quien.id).toBe(2);
    const cupoDespues = eventoService
      .obtenerEventoDetalle(4)
      .tiposEntrada.find((t) => t.id === 201).cupo;
    expect(cupoDespues).toBe(cupoAntes + 2);
  });

  test("ADR 005: rechaza el paso manual a UTILIZADA y transiciona automáticamente CONFIRMADA -> UTILIZADA al llegar evento.fecha", () => {
    expect(() =>
      compraService.actualizarEstado(5, {
        estado: EstadoCompra.UTILIZADA,
        usuarioId: 2,
      })
    ).toThrow("El paso a UTILIZADA es automático al alcanzarse la fecha del evento");

    const compraAntes = compraService.obtenerCompraPorId(5);
    expect(compraAntes.estado).toBe(EstadoCompra.CONFIRMADA);

    const fechaEventoAlcanzada = new Date(compraAntes.evento.fecha);
    const comprasDespues = compraService.listarCompras({
      compradorId: 1,
      fechaActual: fechaEventoAlcanzada,
    });
    const compra5Actualizada = comprasDespues.find((c) => c.id === 5);
    expect(compra5Actualizada.estado).toBe(EstadoCompra.UTILIZADA);

    // Al pasar automáticamente a UTILIZADA habilita la reseña
    const resenia = reseniaService.crearResenia({
      compradorId: 1,
      eventoId: 4,
      puntuacion: 5,
      detalle: "Excelente evento una vez finalizada la fecha",
    });
    expect(resenia.eventoId).toBe(4);
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

  test("impide cancelar vía actualizarEstado sin pasar por la operación de cancelación y conserva estado y cupo", () => {
    // Compra 5: CONFIRMADA en evento 4 (tipoEntrada 201 con cupo 118)
    expect(() =>
      compraService.actualizarEstado(5, {
        estado: EstadoCompra.CANCELADA,
        usuarioId: 2,
      })
    ).toThrow(BusinessRuleError);

    // Compra 6: PENDIENTE en evento 5 (tipoEntrada 203 con cupo 39)
    expect(() =>
      compraService.actualizarEstado(6, {
        estado: EstadoCompra.CANCELADA,
        usuarioId: 1,
      })
    ).toThrow(BusinessRuleError);

    expect(compraService.obtenerCompraPorId(5).estado).toBe(EstadoCompra.CONFIRMADA);
    expect(compraService.obtenerCompraPorId(6).estado).toBe(EstadoCompra.PENDIENTE);

    const cupo201 = eventoService
      .obtenerEventoDetalle(4)
      .tiposEntrada.find((t) => t.id === 201).cupo;
    const cupo203 = eventoService
      .obtenerEventoDetalle(5)
      .tiposEntrada.find((t) => t.id === 203).cupo;
    expect(cupo201).toBe(118);
    expect(cupo203).toBe(39);
  });

  test("rechaza la compra en un evento que ya ocurrió y mantiene el cupo intacto", () => {
    // Evento 1 (Noche Acústica 2025) ocurrió hace 30 días, tipoEntrada 101 tiene cupo 10
    expect(() =>
      compraService.crearCompra({
        compradorId: 4,
        eventoId: 1,
        tipoEntradaId: 101,
        cantidad: 1,
      })
    ).toThrow(BusinessRuleError);

    const cupo101 = eventoService
      .obtenerEventoDetalle(1)
      .tiposEntrada.find((t) => t.id === 101).cupo;
    expect(cupo101).toBe(10);
  });

  test("rechaza que el organizador compre entradas para su propio evento y mantiene el cupo intacto", () => {
    // Evento 4 (Festival Indie Primavera) pertenece a Lucas (2), tipoEntrada 201 tiene cupo 118
    expect(() =>
      compraService.crearCompra({
        compradorId: 2,
        eventoId: 4,
        tipoEntradaId: 201,
        cantidad: 1,
      })
    ).toThrow(BusinessRuleError);

    const cupo201 = eventoService
      .obtenerEventoDetalle(4)
      .tiposEntrada.find((t) => t.id === 201).cupo;
    expect(cupo201).toBe(118);
  });

  test("expone yaReseniado en compras y restringe acceso por usuarioId si se informa", () => {
    // Compra 2 (Mateo 4, evento 1) aún no tiene reseña; Compra 1 (Sofía 1, evento 1) ya fue reseñada
    expect(compraService.obtenerCompraPorId(1, { usuarioId: 1 }).yaReseniado).toBe(true);
    expect(compraService.obtenerCompraPorId(2, { usuarioId: 4 }).yaReseniado).toBe(false);

    // Organizador del evento 1 (Lucas 2) puede visualizar la compra 2
    expect(compraService.obtenerCompraPorId(2, { usuarioId: 2 }).id).toBe(2);

    // Tercero (Valentina 3) no puede visualizar la compra 2 si pasa usuarioId
    expect(() => compraService.obtenerCompraPorId(2, { usuarioId: 3 })).toThrow(BusinessRuleError);

    reseniaService.crearResenia({
      compradorId: 4,
      eventoId: 1,
      puntuacion: 5,
      detalle: "Excelente",
    });
    expect(compraService.obtenerCompraPorId(2).yaReseniado).toBe(true);
  });

  test("filtra compras por estado y soloFuturos y permite enviar mensajes con adjunto sin texto", () => {
    // Sofía (1) tiene compra 1 (UTILIZADA, evento pasado) y compra 5 (CONFIRMADA, evento futuro)
    const confirmadasSofia = compraService.listarCompras({
      compradorId: 1,
      estado: EstadoCompra.CONFIRMADA,
    });
    expect(confirmadasSofia).toHaveLength(1);
    expect(confirmadasSofia[0].id).toBe(5);

    const futurasSofia = compraService.listarCompras({
      compradorId: 1,
      soloFuturos: true,
    });
    expect(futurasSofia).toHaveLength(1);
    expect(futurasSofia[0].id).toBe(5);

    const utilizadasFuturasSofia = compraService.listarCompras({
      compradorId: 1,
      estado: EstadoCompra.UTILIZADA,
      soloFuturos: true,
    });
    expect(utilizadasFuturasSofia).toHaveLength(0);

    const resAdjunto = compraService.agregarMensaje(6, {
      usuarioId: 4,
      adjunto: {
        nombre: "comprobante.png",
        tipoMime: "image/png",
        contenido: "data:image/png;base64,iVBORw0KGgo=",
      },
    });
    expect(resAdjunto.mensaje.remitente.id).toBe(4);
    expect(resAdjunto.mensaje.destinatario.id).toBe(1);
    expect(resAdjunto.mensaje.adjunto.nombre).toBe("comprobante.png");
  });
});
