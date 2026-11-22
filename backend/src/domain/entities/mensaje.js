import { DomainValidationError } from "../errors/DomainError.js";
import { generarId } from "../utils/idGenerator.js";

const TIPOS_ADJUNTO_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

function normalizarAdjunto(adjunto) {
  if (adjunto === null) {
    return null;
  }
  if (
    typeof adjunto !== "object" ||
    typeof adjunto.nombre !== "string" ||
    adjunto.nombre.trim() === "" ||
    !TIPOS_ADJUNTO_PERMITIDOS.includes(adjunto.tipoMime) ||
    typeof adjunto.contenido !== "string"
  ) {
    throw new DomainValidationError(
      "El adjunto debe ser una imagen (JPG, PNG, WEBP) o PDF válido"
    );
  }
  const prefijo = `data:${adjunto.tipoMime};base64,`;
  const cuerpoBase64 = adjunto.contenido.slice(prefijo.length).trim();
  if (!adjunto.contenido.startsWith(prefijo) || cuerpoBase64 === "") {
    throw new DomainValidationError(
      "El adjunto debe ser una imagen (JPG, PNG, WEBP) o PDF válido"
    );
  }
  return {
    nombre: adjunto.nombre.trim(),
    tipoMime: adjunto.tipoMime,
    contenido: adjunto.contenido,
  };
}

export class Mensaje {
  constructor({
    id = generarId(),
    remitente,
    destinatario,
    mensaje = "",
    enviado = new Date(),
    adjunto = null,
  } = {}) {
    if (!remitente) {
      throw new DomainValidationError("El usuario remitente del mensaje es obligatorio");
    }
    if (!destinatario) {
      throw new DomainValidationError("El usuario destinatario del mensaje es obligatorio");
    }
    if (remitente.id === destinatario.id) {
      throw new DomainValidationError(
        "El remitente y el destinatario no pueden ser el mismo usuario"
      );
    }
    if (typeof mensaje !== "string") {
      throw new DomainValidationError("El contenido del mensaje debe ser texto");
    }

    const texto = mensaje.trim();
    const adjuntoNormalizado = normalizarAdjunto(adjunto);

    if (texto === "" && !adjuntoNormalizado) {
      throw new DomainValidationError("El mensaje debe tener texto o un archivo adjunto");
    }

    this.id = id;
    this.remitente = remitente;
    this.destinatario = destinatario;
    this.mensaje = texto;
    this.enviado = enviado;
    this.adjunto = adjuntoNormalizado;
  }

  toJSON() {
    return {
      id: this.id,
      remitente: this.remitente.toJSON(),
      destinatario: this.destinatario.toJSON(),
      mensaje: this.mensaje,
      enviado: this.enviado,
      adjunto: this.adjunto,
    };
  }
}
