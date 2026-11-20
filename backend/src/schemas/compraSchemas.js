import { z } from "zod";
import { EstadoCompra } from "../domain/index.js";
import { emptyStringToUndefined } from "./validator.js";

export const crearCompraSchema = z.object({
  compradorId: z.coerce.number().int().positive("compradorId es obligatorio"),
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
});

export const actualizarEstadoCompraSchema = z.object({
  estado: z.enum([
    EstadoCompra.CONFIRMADA,
    EstadoCompra.UTILIZADA,
    EstadoCompra.REEMBOLSADA,
  ]),
  usuarioId: z.coerce.number().int().positive("usuarioId es obligatorio"),
});

export const accionCompraUsuarioSchema = z.object({
  usuarioId: z.coerce.number().int().positive("usuarioId es obligatorio"),
});

export const agregarMensajeSchema = z.object({
  usuarioId: z.coerce.number().int().positive("usuarioId es obligatorio"),
  mensaje: z.string().trim().min(1, "El mensaje no puede estar vacío"),
});

export const obtenerCompraQuerySchema = z.object({
  usuarioId: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive().optional()
  ),
});
