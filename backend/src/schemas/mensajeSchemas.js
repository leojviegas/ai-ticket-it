import { z } from "zod";
import { emptyStringToUndefined } from "./validator.js";

const optionalPositiveInt = z.preprocess(
  emptyStringToUndefined,
  z.coerce.number().int().positive().optional()
);

export const listarMensajesQuerySchema = z.object({
  compraId: optionalPositiveInt,
  conUsuarioId: optionalPositiveInt,
  remitenteId: optionalPositiveInt,
  destinatarioId: optionalPositiveInt,
});

export const listarConversacionesQuerySchema = z.object({
  incluirVacias: z.preprocess(
    emptyStringToUndefined,
    z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((val) => val === true || val === "true")
      .optional()
      .default(false)
  ),
});
