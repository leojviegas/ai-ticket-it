import { jest } from "@jest/globals";
import { notFoundHandler } from "../../src/middlewares/notFoundHandler.js";
import { errorHandler } from "../../src/middlewares/errorHandler.js";
import { RequestValidationError } from "../../src/controllers/errors/ControllerError.js";
import {
  DomainValidationError,
  InvalidStateTransitionError,
} from "../../src/domain/errors/DomainError.js";
import {
  EntityNotFoundError,
  DuplicateEntityError,
} from "../../src/repositories/errors/RepositoryError.js";
import {
  NotFoundError,
  ConflictError,
  BusinessRuleError,
} from "../../src/services/errors/ServiceError.js";

function createMockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe("Middlewares (errorHandler y notFoundHandler)", () => {
  test("notFoundHandler responde 404 con método y ruta original", () => {
    const req = { method: "GET", originalUrl: "/api/ruta-inexistente" };
    const res = createMockRes();

    notFoundHandler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      error: "Ruta no encontrada: GET /api/ruta-inexistente",
    });
  });

  test("errorHandler mapea errores de validación, dominio, repositorio y servicio a sus códigos HTTP", () => {
    const casos = [
      [new RequestValidationError("Dato inválido", [{ path: "id", message: "inválido" }]), 400, true],
      [new DomainValidationError("Invariante violada"), 400, false],
      [new BusinessRuleError("Regla incumplida"), 400, false],
      [new EntityNotFoundError("Entidad no encontrada"), 404, false],
      [new NotFoundError("Recurso no encontrado"), 404, false],
      [new InvalidStateTransitionError("Transición prohibida"), 409, false],
      [new ConflictError("Conflicto de negocio"), 409, false],
      [new DuplicateEntityError("Entidad duplicada"), 409, false],
    ];

    for (const [error, expectedStatus, hasDetails] of casos) {
      const res = createMockRes();
      errorHandler(error, {}, res, () => {});
      expect(res.statusCode).toBe(expectedStatus);
      expect(res.body.error).toBe(error.message);
      if (hasDetails) {
        expect(res.body.details).toEqual(error.details);
      } else {
        expect(res.body.details).toBeUndefined();
      }
    }
  });

  test("errorHandler normaliza errores de JSON malformado (entity.parse.failed) como 400", () => {
    const parseErr = Object.assign(new SyntaxError("Unexpected token"), {
      status: 400,
      type: "entity.parse.failed",
    });
    const res = createMockRes();

    errorHandler(parseErr, {}, res, () => {});

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: "El cuerpo de la petición debe ser un objeto JSON válido",
    });
  });

  test("errorHandler devuelve 500 ocultando detalles ante errores internos no controlados", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      const res = createMockRes();
      const err = new Error("Fallo inesperado de memoria");

      errorHandler(err, {}, res, () => {});

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: "Internal Server Error" });
      expect(consoleSpy).toHaveBeenCalledWith(err);
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
