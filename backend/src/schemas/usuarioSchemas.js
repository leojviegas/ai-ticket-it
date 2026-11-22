import { z } from "zod";

export const toggleFavoritoSchema = z.object({
  eventoId: z.coerce.number().int().positive("eventoId debe ser un entero positivo"),
});
