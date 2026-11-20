import { RequestValidationError } from "../controllers/errors/ControllerError.js";

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
