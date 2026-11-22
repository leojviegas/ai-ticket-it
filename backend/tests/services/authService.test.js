import bcrypt from "bcryptjs";
import { authService } from "../../src/services/index.js";
import { Usuario } from "../../src/domain/index.js";
import { resetContadoresId } from "../../src/domain/utils/idGenerator.js";
import { clearAllRepositories, usuarioRepository } from "../../src/repositories/index.js";
import { ConflictError } from "../../src/services/errors/ServiceError.js";

describe("AuthService", () => {
  beforeEach(() => {
    clearAllRepositories();
    resetContadoresId();
  });

  test("register crea un usuario con passwordHash bcrypt, devuelve accessToken verificable y no expone el hash", async () => {
    const resultado = await authService.register({
      nombre: "Lucía",
      apellido: "Fernández",
      email: "  Lucia@Example.com ",
      password: "Password123",
    });

    expect(resultado.accessToken).toEqual(expect.any(String));
    expect(resultado.usuario).toEqual({
      id: 1,
      nombre: "Lucía",
      apellido: "Fernández",
      email: "lucia@example.com",
      favoritosIds: [],
    });
    expect(resultado.usuario.passwordHash).toBeUndefined();

    const payload = authService.verificarAccessToken(resultado.accessToken);
    expect(payload.id).toBe(1);
    expect(payload.email).toBe("lucia@example.com");

    const guardado = usuarioRepository.findByEmail("lucia@example.com");
    expect(guardado).not.toBeNull();
    expect(guardado.passwordHash).not.toBe("Password123");
    expect(await bcrypt.compare("Password123", guardado.passwordHash)).toBe(true);
  });

  test("register lanza ConflictError (409) si el email ya se encuentra registrado", async () => {
    await authService.register({
      nombre: "Lucía",
      apellido: "Fernández",
      email: "lucia@example.com",
      password: "Password123",
    });

    await expect(
      authService.register({
        nombre: "Otra",
        apellido: "Persona",
        email: "LUCIA@example.com",
        password: "Password123",
      })
    ).rejects.toThrow(ConflictError);
  });

  test("login autentica credenciales válidas y rechaza con 401 si falla email, contraseña o no tiene hash", async () => {
    await authService.register({
      nombre: "Mateo",
      apellido: "Rossi",
      email: "mateo@example.com",
      password: "miClaveSegura",
    });

    const resultado = await authService.login({
      email: "  MATEO@example.com ",
      password: "miClaveSegura",
    });

    expect(resultado.usuario).toEqual({
      id: 1,
      nombre: "Mateo",
      apellido: "Rossi",
      email: "mateo@example.com",
      favoritosIds: [],
    });
    expect(resultado.usuario.passwordHash).toBeUndefined();
    const payload = authService.verificarAccessToken(resultado.accessToken);
    expect(payload.id).toBe(1);

    await expect(
      authService.login({ email: "mateo@example.com", password: "incorrecta" })
    ).rejects.toMatchObject({ status: 401, message: "Credenciales inválidas" });

    await expect(
      authService.login({ email: "inexistente@example.com", password: "miClaveSegura" })
    ).rejects.toMatchObject({ status: 401, message: "Credenciales inválidas" });

    usuarioRepository.save(
      new Usuario({ id: 2, nombre: "Sin", apellido: "Clave", email: "sinclave@example.com" })
    );
    await expect(
      authService.login({ email: "sinclave@example.com", password: "cualquiera" })
    ).rejects.toMatchObject({ status: 401, message: "Credenciales inválidas" });
  });

  test("obtenerUsuarioActual devuelve los datos frescos del usuario y rechaza con 401 si ya no existe en memoria", async () => {
    const { usuario } = await authService.register({
      nombre: "Sofía",
      apellido: "Martínez",
      email: "sofia@example.com",
      password: "Password123",
    });

    const actual = authService.obtenerUsuarioActual(usuario.id);
    expect(actual).toEqual({
      id: 1,
      nombre: "Sofía",
      apellido: "Martínez",
      email: "sofia@example.com",
      favoritosIds: [],
    });
    expect(actual.passwordHash).toBeUndefined();

    expect(() => authService.obtenerUsuarioActual(99999)).toThrow("La sesión ya no es válida");
  });
});
