import { z } from "zod";
import { emptyStringToUndefined } from "./validator.js";

export const crearReseniaSchema = z.object({
  compradorId: z.coerce.number().int().positive("compradorId es obligatorio"),
  eventoId: z.coerce.number().int().positive("eventoId es obligatorio"),
  puntuacion: z.coerce
    .number()
    .min(1, "La puntuación mínima es 1")
    .max(5, "La puntuación máxima es 5"),
  detalle: z.string().trim().min(1, "El comentario de la reseña es obligatorio"),
});

export const listarReseniasQuerySchema = z.object({
  compradorId: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive().optional()
  ),
  eventoId: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive().optional()
  ),
});
