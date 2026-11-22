import { seedDemo } from "../../data/seeders/demoSeeder.js";
import { reseniaService, eventoService } from "../../src/services/index.js";
import { BusinessRuleError, ConflictError } from "../../src/services/errors/ServiceError.js";

describe("ReseniaService", () => {
  beforeEach(() => {
    seedDemo();
  });

  test("permite crear reseña si el comprador tiene compra UTILIZADA y recalcula al vuelo puntaje del evento y del organizador (Opción A)", () => {
    // Mateo (4) tiene compra 2 en estado UTILIZADA sobre evento 1 (Noche Acústica 2025, de Lucas 2)
    // Antes: Lucas tiene reseñas 5 y 4.5 (promedio 4.75)
    const nueva = reseniaService.crearResenia({
      compradorId: 4,
      eventoId: 1,
      puntuacion: 2.5,
      detalle: "Buen sonido pero demasiado calor en el lugar",
    });

    expect(nueva.puntuacion).toBe(2.5);

    // Nuevo promedio global de Lucas: (5 + 4.5 + 2.5) / 3 = 4
    const resumenOrg = reseniaService.obtenerResumenPorOrganizador(2);
    expect(resumenOrg.puntajeOrganizador).toBe(4);
    expect(resumenOrg.cantidadResenias).toBe(3);

    // Promedio propio del evento 1 también es 4
    const detalleEvento = eventoService.obtenerEventoDetalle(1);
    expect(detalleEvento.puntajeEvento).toBe(4);
    expect(detalleEvento.cantidadReseniasEvento).toBe(3);

    // No puede reseñar dos veces el mismo evento
    expect(() =>
      reseniaService.crearResenia({
        compradorId: 4,
        eventoId: 1,
        puntuacion: 5,
        detalle: "Otro comentario",
      })
    ).toThrow(ConflictError);
  });

  test("rechaza reseña si el comprador no tiene una entrada UTILIZADA para el evento", () => {
    // Sofía (1) tiene compra 5 CONFIRMADA (no UTILIZADA) en evento 4
    expect(() =>
      reseniaService.crearResenia({
        compradorId: 1,
        eventoId: 4,
        puntuacion: 5,
        detalle: "Todavía ni fui al festival",
      })
    ).toThrow(BusinessRuleError);
  });

  test("lista reseñas filtradas por compradorId o eventoId y expone alias consistentes por organizador", () => {
    const deSofia = reseniaService.listarResenias({ compradorId: 1 });
    expect(deSofia).toHaveLength(1);
    expect(deSofia[0].eventoId).toBe(1);

    const delEvento1 = reseniaService.listarResenias({ eventoId: 1 });
    expect(delEvento1).toHaveLength(2);

    const resumen = reseniaService.obtenerResumenPorOrganizador(2);
    expect(resumen.cantidadReseniasOrganizador).toBe(2);
    expect(resumen.reseniasOrganizador).toHaveLength(2);
  });
});
