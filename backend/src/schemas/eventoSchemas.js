import { z } from "zod";
import { EstadoCompra } from "../domain/index.js";
import { emptyStringToUndefined } from "./validator.js";

const DATA_URI_IMAGEN_REGEX = /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/;

function esMultimediaValida(valor) {
  if (DATA_URI_IMAGEN_REGEX.test(valor)) {
    return true;
  }
  try {
    const url = new URL(valor);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const tipoEntradaInputSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del tipo de entrada es obligatorio"),
  descripcion: z.string().trim().min(1, "La descripción del tipo de entrada es obligatoria"),
  precio: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  cupo: z.coerce.number().int().min(1, "El cupo debe ser un entero mayor o igual a 1"),
});

export const crearEventoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del evento es obligatorio"),
  descripcion: z.string().trim().min(1, "La descripción del evento es obligatoria"),
  categoriaId: z.coerce.number().int().positive("categoriaId es obligatorio"),
  organizadorId: z.coerce.number().int().positive("organizadorId debe ser un entero positivo").optional(),
  fecha: z.string().min(1, "La fecha del evento es obligatoria"),
  multimedia: z
    .array(
      z
        .string()
        .trim()
        .refine(esMultimediaValida, "Cada elemento multimedia debe ser una URL válida o imagen en base64")
    )
    .optional()
    .default([]),
  tiposEntrada: z
    .array(tipoEntradaInputSchema)
    .min(1, "El evento debe tener al menos un tipo de entrada"),
});

export const listarEventosQuerySchema = z.object({
  q: z.preprocess(emptyStringToUndefined, z.string().optional()),
  categoriaId: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive().optional()
  ),
  organizadorId: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive().optional()
  ),
  precioMin: z.preprocess(emptyStringToUndefined, z.coerce.number().min(0).optional()),
  precioMax: z.preprocess(emptyStringToUndefined, z.coerce.number().min(0).optional()),
  ordenarPor: z.preprocess(
    emptyStringToUndefined,
    z.enum(["precio", "fecha", "puntaje"]).optional().default("fecha")
  ),
  orden: z.preprocess(emptyStringToUndefined, z.enum(["asc", "desc"]).optional()),
  soloFuturos: z.preprocess(
    emptyStringToUndefined,
    z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((val) => val === true || val === "true")
      .optional()
  ),
});

export const obtenerComprasEventoQuerySchema = z.object({
  organizadorId: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive().optional()
  ),
  estado: z.preprocess(
    emptyStringToUndefined,
    z.enum(Object.values(EstadoCompra)).optional()
  ),
});
