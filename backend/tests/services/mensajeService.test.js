import { seedDemo } from "../../data/seeders/demoSeeder.js";
import { mensajeService, compraService } from "../../src/services/index.js";
import { ForbiddenError } from "../../src/services/errors/ServiceError.js";

describe("MensajeService", () => {
  beforeEach(() => {
    seedDemo();
  });

  test("lista todos los mensajes del usuario en ambos roles (comprador y organizador) ordenados cronológicamente", () => {
    // Sofía (1) participa en compra 5 (como compradora con Lucas, 2 mensajes) y compra 6 (como organizadora con Mateo, 1 mensaje)
    const mensajesSofia = mensajeService.listarMensajes({ usuarioAutenticadoId: 1 });
    expect(mensajesSofia).toHaveLength(3);
    expect(mensajesSofia.some((m) => m.rolUsuario === "COMPRADOR")).toBe(true);
    expect(mensajesSofia.some((m) => m.rolUsuario === "ORGANIZADOR")).toBe(true);
    for (let i = 1; i < mensajesSofia.length; i += 1) {
      expect(new Date(mensajesSofia[i].enviado).getTime()).toBeGreaterThanOrEqual(
        new Date(mensajesSofia[i - 1].enviado).getTime()
      );
    }
  });

  test("filtra bidireccionalmente con conUsuarioId y unidireccionalmente con remitenteId/destinatarioId", () => {
    // Sofía (1) conversando con Lucas (2) en compra 5: Sofía mandó 1 y Lucas respondió 1
    const conversacionConLucas = mensajeService.listarMensajes({
      usuarioAutenticadoId: 1,
      conUsuarioId: 2,
    });
    expect(conversacionConLucas).toHaveLength(2);
    expect(conversacionConLucas[0].remitente.id).toBe(1);
    expect(conversacionConLucas[0].destinatario.id).toBe(2);
    expect(conversacionConLucas[1].remitente.id).toBe(2);
    expect(conversacionConLucas[1].destinatario.id).toBe(1);

    const enviadosPorLucas = mensajeService.listarMensajes({
      usuarioAutenticadoId: 1,
      remitenteId: 2,
      destinatarioId: 1,
    });
    expect(enviadosPorLucas).toHaveLength(1);
    expect(enviadosPorLucas[0].remitente.id).toBe(2);
  });

  test("filtra por compraId y rechaza con ForbiddenError si el usuario no participa o consulta terceros", () => {
    const deCompra6 = mensajeService.listarMensajes({
      usuarioAutenticadoId: 1,
      compraId: 6,
    });
    expect(deCompra6).toHaveLength(1);
    expect(deCompra6[0].compraId).toBe(6);

    // Valentina (3) no participa en compra 5
    expect(() =>
      mensajeService.listarMensajes({ usuarioAutenticadoId: 3, compraId: 5 })
    ).toThrow(ForbiddenError);

    // Valentina (3) intenta consultar mensajes entre Sofía (1) y Lucas (2)
    expect(() =>
      mensajeService.listarMensajes({
        usuarioAutenticadoId: 3,
        remitenteId: 1,
        destinatarioId: 2,
      })
    ).toThrow(ForbiddenError);
  });

  test("listarConversaciones agrupa chats por compra ordenados por último mensaje y respeta incluirVacias", () => {
    // Agregamos un mensaje nuevo en compra 6 para asegurarnos de que quede primera
    compraService.agregarMensaje(6, {
      usuarioId: 1,
      mensaje: "Recibido, ahora confirmo tu compra.",
    });

    const activasSofia = mensajeService.listarConversaciones(1);
    expect(activasSofia).toHaveLength(2);
    expect(activasSofia[0].compraId).toBe(6);
    expect(activasSofia[0].rolUsuario).toBe("ORGANIZADOR");
    expect(activasSofia[0].contraparte.id).toBe(4);
    expect(activasSofia[0].cantidadMensajes).toBe(2);
    expect(activasSofia[0].ultimoMensaje.mensaje).toBe("Recibido, ahora confirmo tu compra.");
    expect(activasSofia[1].compraId).toBe(5);
    expect(activasSofia[1].rolUsuario).toBe("COMPRADOR");
    expect(activasSofia[1].contraparte.id).toBe(2);

    // Sofía tiene también compra 1, 3 y 8 sin mensajes
    const todasSofia = mensajeService.listarConversaciones(1, { incluirVacias: true });
    expect(todasSofia.length).toBeGreaterThan(2);
    expect(todasSofia.at(-1).cantidadMensajes).toBe(0);
    expect(todasSofia.at(-1).ultimoMensaje).toBeNull();
  });
});
