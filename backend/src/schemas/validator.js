import { z } from "zod";
import { RequestValidationError } from "../controllers/errors/ControllerError.js";

export function emptyStringToUndefined(value) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
}

export function validateSchema(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    const firstMessage = details[0]?.message || "Datos de entrada inválidos";
    throw new RequestValidationError(firstMessage, details);
  }
  return result.data;
}

export const idParamSchema = z.object({
  id: z.coerce
    .number("El parámetro id debe ser un número entero positivo")
    .int("El parámetro id debe ser un número entero positivo")
    .positive("El parámetro id debe ser un número entero positivo"),
});

export function validateIdParam(params) {
  return validateSchema(idParamSchema, params).id;
}
