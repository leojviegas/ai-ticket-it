import { z } from "zod";
import { EstadoCompra } from "../domain/index.js";
import { emptyStringToUndefined } from "./validator.js";

const TIPOS_MIME_ADJUNTO = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const crearCompraSchema = z.object({
  compradorId: z.coerce.number().int().positive("compradorId debe ser un entero positivo").optional(),
  eventoId: z.coerce.number().int().positive("eventoId es obligatorio"),
  tipoEntradaId: z.coerce.number().int().positive("tipoEntradaId es obligatorio"),
  cantidad: z.coerce.number().int().positive("La cantidad debe ser un entero mayor a 0"),
});

export const listarComprasQuerySchema = z.object({
  compradorId: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive().optional()
  ),
  eventoId: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive().optional()
  ),
  estado: z.preprocess(
    emptyStringToUndefined,
    z.enum(Object.values(EstadoCompra)).optional()
  ),
  soloFuturos: z.preprocess(
    emptyStringToUndefined,
    z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((val) => val === true || val === "true")
      .optional()
  ),
});

export const actualizarEstadoCompraSchema = z.object({
  estado: z.enum([EstadoCompra.CONFIRMADA, EstadoCompra.REEMBOLSADA]),
  usuarioId: z.coerce.number().int().positive("usuarioId debe ser un entero positivo").optional(),
});

export const accionCompraUsuarioSchema = z.object({
  usuarioId: z.coerce.number().int().positive("usuarioId debe ser un entero positivo").optional(),
});

export const adjuntoMensajeSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre del adjunto es obligatorio"),
    tipoMime: z.enum(TIPOS_MIME_ADJUNTO, {
      error: "El tipo de archivo debe ser JPG, PNG, WEBP o PDF",
    }),
    contenido: z
      .string()
      .trim()
      .regex(
        /^data:(image\/(jpeg|png|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/,
        "El contenido del adjunto debe ser un Data URI base64 válido"
      ),
  })
  .refine(
    (adjunto) => adjunto.contenido.startsWith(`data:${adjunto.tipoMime};base64,`),
    {
      message: "El contenido del adjunto no coincide con el tipoMime informado",
      path: ["contenido"],
    }
  );

export const agregarMensajeSchema = z
  .object({
    usuarioId: z.coerce.number().int().positive("usuarioId debe ser un entero positivo").optional(),
    mensaje: z.string().trim().optional().default(""),
    adjunto: adjuntoMensajeSchema.nullable().optional().default(null),
  })
  .refine((datos) => datos.mensaje.length > 0 || datos.adjunto !== null, {
    message: "El mensaje debe tener texto o un archivo adjunto",
    path: ["mensaje"],
  });

export const obtenerCompraQuerySchema = z.object({
  usuarioId: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive().optional()
  ),
});
