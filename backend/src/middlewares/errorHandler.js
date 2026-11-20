import {
  DomainValidationError,
  InvalidStateTransitionError,
} from "../domain/errors/DomainError.js";
import {
  EntityNotFoundError,
  DuplicateEntityError,
} from "../repositories/errors/RepositoryError.js";
import {
  NotFoundError,
  ConflictError,
  BusinessRuleError,
} from "../services/errors/ServiceError.js";
import { RequestValidationError } from "../controllers/errors/ControllerError.js";

const HTTP_STATUS_BY_ERROR = [
  [RequestValidationError, 400],
  [DomainValidationError, 400],
  [BusinessRuleError, 400],
  [EntityNotFoundError, 404],
  [NotFoundError, 404],
  [InvalidStateTransitionError, 409],
  [ConflictError, 409],
  [DuplicateEntityError, 409],
];

function resolveHttpStatus(error) {
  if (error.status && typeof error.status === "number") {
    return error.status;
  }
  const match = HTTP_STATUS_BY_ERROR.find(([TipoError]) => error instanceof TipoError);
  return match ? match[1] : 500;
}

export function errorHandler(err, req, res, next) {
  const status = resolveHttpStatus(err);

  if (status >= 500) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }

  const message =
    err.type === "entity.parse.failed"
      ? "El cuerpo de la petición debe ser un objeto JSON válido"
      : err.message;

  const body = { error: message };
  if (err.details) {
    body.details = err.details;
  }
  return res.status(status).json(body);
}
