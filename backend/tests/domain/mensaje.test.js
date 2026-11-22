import { Usuario } from "../../src/domain/entities/usuario.js";
import { Mensaje } from "../../src/domain/entities/mensaje.js";
import { DomainValidationError } from "../../src/domain/errors/DomainError.js";
import { resetContadoresId } from "../../src/domain/utils/idGenerator.js";

describe("Mensaje", () => {
  let remitente;
  let destinatario;

  beforeEach(() => {
    resetContadoresId();
    remitente = new Usuario({ nombre: "Sofía", apellido: "Martínez" });
    destinatario = new Usuario({ nombre: "Lucas", apellido: "Fernández" });
  });

  test("crea un mensaje válido con remitente, destinatario, texto recortado y fecha por defecto", () => {
    resetContadoresId();
    const m = new Mensaje({
      remitente,
      destinatario,
      mensaje: "  Hola, ¿hay estacionamiento?  ",
    });

    expect(m.id).toBe(1);
    expect(m.remitente).toBe(remitente);
    expect(m.destinatario).toBe(destinatario);
    expect(m.mensaje).toBe("Hola, ¿hay estacionamiento?");
    expect(m.enviado).toBeInstanceOf(Date);
    expect(m.adjunto).toBeNull();
    expect(m.toJSON()).toEqual({
      id: 1,
      remitente: remitente.toJSON(),
      destinatario: destinatario.toJSON(),
      mensaje: "Hola, ¿hay estacionamiento?",
      enviado: m.enviado,
      adjunto: null,
    });
  });

  test("permite crear un mensaje con solo adjunto válido (JPG, PNG, WEBP o PDF) o texto más adjunto", () => {
    const pdf = new Mensaje({
      remitente,
      destinatario,
      adjunto: {
        nombre: "  comprobante.pdf  ",
        tipoMime: "application/pdf",
        contenido: "data:application/pdf;base64,JVBERi0xLjQ=",
      },
    });
    expect(pdf.mensaje).toBe("");
    expect(pdf.adjunto).toEqual({
      nombre: "comprobante.pdf",
      tipoMime: "application/pdf",
      contenido: "data:application/pdf;base64,JVBERi0xLjQ=",
    });

    const tiposImagen = ["image/jpeg", "image/png", "image/webp"];
    for (const tipoMime of tiposImagen) {
      const img = new Mensaje({
        remitente,
        destinatario,
        mensaje: "Adjunto comprobante",
        adjunto: {
          nombre: "ticket.img",
          tipoMime,
          contenido: `data:${tipoMime};base64,AAAA`,
        },
      });
      expect(img.adjunto.tipoMime).toBe(tipoMime);
      expect(img.mensaje).toBe("Adjunto comprobante");
    }
  });

  test("lanza DomainValidationError si falta remitente/destinatario, coinciden, o faltan texto y adjunto", () => {
    expect(() => new Mensaje({ destinatario, mensaje: "Hola" })).toThrow(
      "El usuario remitente del mensaje es obligatorio"
    );
    expect(() => new Mensaje({ remitente, mensaje: "Hola" })).toThrow(
      "El usuario destinatario del mensaje es obligatorio"
    );
    expect(() => new Mensaje({ remitente, destinatario: remitente, mensaje: "Hola" })).toThrow(
      "El remitente y el destinatario no pueden ser el mismo usuario"
    );
    expect(() => new Mensaje({ remitente, destinatario, mensaje: 123 })).toThrow(
      "El contenido del mensaje debe ser texto"
    );
    expect(() => new Mensaje({ remitente, destinatario, mensaje: "" })).toThrow(
      "El mensaje debe tener texto o un archivo adjunto"
    );
    expect(() => new Mensaje({ remitente, destinatario, mensaje: "   " })).toThrow(
      "El mensaje debe tener texto o un archivo adjunto"
    );
    expect(() => new Mensaje({ remitente, destinatario })).toThrow(
      "El mensaje debe tener texto o un archivo adjunto"
    );
    expect(() => new Mensaje()).toThrow(DomainValidationError);
  });

  test("lanza DomainValidationError ante adjuntos malformados o con MIME no permitido", () => {
    const casosInvalidos = [
      "no-es-objeto",
      { nombre: "", tipoMime: "application/pdf", contenido: "data:application/pdf;base64,AAAA" },
      { nombre: 123, tipoMime: "application/pdf", contenido: "data:application/pdf;base64,AAAA" },
      { nombre: "doc.txt", tipoMime: "text/plain", contenido: "data:text/plain;base64,AAAA" },
      { nombre: "comp.pdf", tipoMime: "application/pdf", contenido: 123 },
      { nombre: "comp.pdf", tipoMime: "application/pdf", contenido: "data:image/png;base64,AAAA" },
      { nombre: "comp.pdf", tipoMime: "application/pdf", contenido: "data:application/pdf;base64," },
      { nombre: "comp.pdf", tipoMime: "application/pdf", contenido: "data:application/pdf;base64,   " },
    ];

    for (const adjunto of casosInvalidos) {
      expect(
        () => new Mensaje({ remitente, destinatario, mensaje: "Con adjunto malo", adjunto })
      ).toThrow("El adjunto debe ser una imagen (JPG, PNG, WEBP) o PDF válido");
    }
  });
});
