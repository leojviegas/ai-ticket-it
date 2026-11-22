import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { notFoundHandler } from "../../src/middlewares/notFoundHandler.js";
import { errorHandler } from "../../src/middlewares/errorHandler.js";
import {
  register,
  login,
  requireAuth,
  verificarAccessToken,
} from "../../src/middlewares/authMiddleware.js";
import { Usuario } from "../../src/domain/index.js";
import { resetContadoresId } from "../../src/domain/utils/idGenerator.js";
import {
  clearAllRepositories,
  usuarioRepository,
} from "../../src/repositories/index.js";
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

describe("Middleware de autenticación (authMiddleware)", () => {
  beforeEach(() => {
    clearAllRepositories();
    resetContadoresId();
  });

  test("register crea un usuario con passwordHash bcrypt, responde 201 y devuelve accessToken sin exponer el hash", async () => {
    const req = {
      body: {
        nombre: "Lucía",
        apellido: "Fernández",
        email: "  Lucia@Example.com ",
        password: "Password123",
      },
    };
    const res = createMockRes();
    const next = jest.fn();

    await register(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.usuario).toEqual({
      id: 1,
      nombre: "Lucía",
      apellido: "Fernández",
      email: "lucia@example.com",
      favoritosIds: [],
    });
    expect(res.body.usuario.passwordHash).toBeUndefined();
    expect(req.user).toEqual(res.body.usuario);

    const guardado = usuarioRepository.findByEmail("lucia@example.com");
    expect(guardado).not.toBeNull();
    expect(guardado.passwordHash).not.toBe("Password123");
    expect(await bcrypt.compare("Password123", guardado.passwordHash)).toBe(true);
  });

  test("register deriva a next ConflictError (409) si el email ya existe y RequestValidationError (400) si faltan datos o son inválidos", async () => {
    const reqValido = {
      body: {
        nombre: "Lucía",
        apellido: "Fernández",
        email: "lucia@example.com",
        password: "Password123",
      },
    };
    await register(reqValido, createMockRes(), jest.fn());

    const nextDup = jest.fn();
    await register(
      {
        body: {
          nombre: "Otra",
          apellido: "Persona",
          email: "LUCIA@example.com",
          password: "Password123",
        },
      },
      createMockRes(),
      nextDup
    );
    expect(nextDup).toHaveBeenCalledWith(expect.any(ConflictError));

    const nextInvalido = jest.fn();
    await register(
      {
        body: {
          nombre: "",
          apellido: "Pérez",
          email: "email-invalido",
          password: "123",
        },
      },
      createMockRes(),
      nextInvalido
    );
    expect(nextInvalido).toHaveBeenCalledWith(expect.any(RequestValidationError));
  });

  test("login valida credenciales, devuelve 200 con accessToken verificable y rechaza credenciales inválidas o faltantes", async () => {
    await register(
      {
        body: {
          nombre: "Mateo",
          apellido: "Rossi",
          email: "mateo@example.com",
          password: "miClaveSegura",
        },
      },
      createMockRes(),
      jest.fn()
    );

    const reqLogin = {
      body: {
        email: "  MATEO@example.com ",
        password: "miClaveSegura",
      },
    };
    const resLogin = createMockRes();
    const nextLogin = jest.fn();

    await login(reqLogin, resLogin, nextLogin);

    expect(nextLogin).not.toHaveBeenCalled();
    expect(resLogin.statusCode).toBe(200);
    expect(resLogin.body.usuario).toEqual({
      id: 1,
      nombre: "Mateo",
      apellido: "Rossi",
      email: "mateo@example.com",
      favoritosIds: [],
    });
    expect(resLogin.body.usuario.passwordHash).toBeUndefined();

    const payload = verificarAccessToken(resLogin.body.accessToken);
    expect(payload.id).toBe(1);
    expect(payload.email).toBe("mateo@example.com");

    // Contraseña incorrecta -> 401
    const nextBadPass = jest.fn();
    await login(
      { body: { email: "mateo@example.com", password: "incorrecta" } },
      createMockRes(),
      nextBadPass
    );
    expect(nextBadPass).toHaveBeenCalledTimes(1);
    expect(nextBadPass.mock.calls[0][0].status).toBe(401);

    // Email inexistente -> 401
    const nextUnknown = jest.fn();
    await login(
      { body: { email: "noexiste@example.com", password: "miClaveSegura" } },
      createMockRes(),
      nextUnknown
    );
    expect(nextUnknown).toHaveBeenCalledTimes(1);
    expect(nextUnknown.mock.calls[0][0].status).toBe(401);

    // Usuario sin passwordHash -> 401
    usuarioRepository.save(
      new Usuario({ id: 2, nombre: "Sin", apellido: "Clave", email: "sinclave@example.com" })
    );
    const nextSinHash = jest.fn();
    await login(
      { body: { email: "sinclave@example.com", password: "cualquiera" } },
      createMockRes(),
      nextSinHash
    );
    expect(nextSinHash.mock.calls[0][0].status).toBe(401);

    // Campos faltantes -> 400 RequestValidationError
    const nextEmpty = jest.fn();
    await login({ body: { email: "", password: "" } }, createMockRes(), nextEmpty);
    expect(nextEmpty).toHaveBeenCalledWith(expect.any(RequestValidationError));
  });

  test("requireAuth valida la firma del Bearer token, pobla req.user y rechaza tokens faltantes o inválidos", async () => {
    const resReg = createMockRes();
    await register(
      {
        body: {
          nombre: "Sofía",
          apellido: "Martínez",
          email: "sofia@example.com",
          password: "Password123",
        },
      },
      resReg,
      jest.fn()
    );
    const token = resReg.body.accessToken;

    // Caso válido
    const reqValido = { headers: { authorization: `Bearer ${token}` } };
    const resValido = createMockRes();
    const nextValido = jest.fn();

    requireAuth(reqValido, resValido, nextValido);

    expect(nextValido).toHaveBeenCalledTimes(1);
    expect(reqValido.user.id).toBe(1);
    expect(reqValido.user.email).toBe("sofia@example.com");

    // Sin header Authorization
    const resSinHeader = createMockRes();
    const nextSinHeader = jest.fn();
    requireAuth({ headers: {} }, resSinHeader, nextSinHeader);
    expect(nextSinHeader).not.toHaveBeenCalled();
    expect(resSinHeader.statusCode).toBe(401);

    // Formato sin Bearer o vacío
    const resMalFormato = createMockRes();
    requireAuth({ headers: { authorization: token } }, resMalFormato, jest.fn());
    expect(resMalFormato.statusCode).toBe(401);

    const resBearerVacio = createMockRes();
    requireAuth({ headers: { authorization: "Bearer   " } }, resBearerVacio, jest.fn());
    expect(resBearerVacio.statusCode).toBe(401);

    // Token adulterado / firmado con otro secreto
    const tokenOtraClave = jwt.sign({ id: 1 }, "otro-secreto");
    const resTokenMalo = createMockRes();
    const nextTokenMalo = jest.fn();
    requireAuth({ headers: { authorization: `Bearer ${tokenOtraClave}` } }, resTokenMalo, nextTokenMalo);
    expect(nextTokenMalo).not.toHaveBeenCalled();
    expect(resTokenMalo.statusCode).toBe(401);
    expect(resTokenMalo.body).toEqual({ error: "Token inválido o expirado" });
  });
});
