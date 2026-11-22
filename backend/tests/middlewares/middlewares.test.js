import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { notFoundHandler } from "../../src/middlewares/notFoundHandler.js";
import { errorHandler } from "../../src/middlewares/errorHandler.js";
import { requireAuth } from "../../src/middlewares/authMiddleware.js";
import { authService } from "../../src/services/index.js";
import { resetContadoresId } from "../../src/domain/utils/idGenerator.js";
import { clearAllRepositories } from "../../src/repositories/index.js";
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
  ForbiddenError,
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
      [new ForbiddenError("Acceso denegado"), 403, false],
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

describe("Middleware de autenticación (requireAuth)", () => {
  beforeEach(() => {
    clearAllRepositories();
    resetContadoresId();
  });

  test("requireAuth valida la firma del Bearer token, pobla req.user y llama a next()", async () => {
    const { accessToken } = await authService.register({
      nombre: "Sofía",
      apellido: "Martínez",
      email: "sofia@example.com",
      password: "Password123",
    });

    const req = { headers: { authorization: `Bearer ${accessToken}` } };
    const res = createMockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.id).toBe(1);
    expect(req.user.email).toBe("sofia@example.com");
  });

  test("requireAuth responde 401 ante ausencia de token, formato incorrecto o firma inválida", () => {
    const resSinHeader = createMockRes();
    const nextSinHeader = jest.fn();
    requireAuth({ headers: {} }, resSinHeader, nextSinHeader);
    expect(nextSinHeader).not.toHaveBeenCalled();
    expect(resSinHeader.statusCode).toBe(401);

    const resMalFormato = createMockRes();
    requireAuth({ headers: { authorization: "token-sin-bearer" } }, resMalFormato, jest.fn());
    expect(resMalFormato.statusCode).toBe(401);

    const resBearerVacio = createMockRes();
    requireAuth({ headers: { authorization: "Bearer   " } }, resBearerVacio, jest.fn());
    expect(resBearerVacio.statusCode).toBe(401);

    const tokenOtraClave = jwt.sign({ id: 1 }, "otro-secreto");
    const resTokenMalo = createMockRes();
    const nextTokenMalo = jest.fn();
    requireAuth(
      { headers: { authorization: `Bearer ${tokenOtraClave}` } },
      resTokenMalo,
      nextTokenMalo
    );
    expect(nextTokenMalo).not.toHaveBeenCalled();
    expect(resTokenMalo.statusCode).toBe(401);
    expect(resTokenMalo.body).toEqual({ error: "Token inválido o expirado" });
  });
});
