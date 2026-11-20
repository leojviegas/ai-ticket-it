import { seedDemo } from "../../data/seeders/demoSeeder.js";
import { usuarioService } from "../../src/services/index.js";
import { EntityNotFoundError } from "../../src/repositories/errors/RepositoryError.js";

describe("UsuarioService", () => {
  beforeEach(() => {
    seedDemo();
  });

  test("lista todos los usuarios con su puntaje de organizador calculado al vuelo", () => {
    const usuarios = usuarioService.listarUsuarios();

    expect(usuarios).toHaveLength(4);
    const sofia = usuarios.find((u) => u.id === 1);
    const lucas = usuarios.find((u) => u.id === 2);
    const mateo = usuarios.find((u) => u.id === 4);

    expect(sofia.puntajeOrganizador).toBe(4);
    expect(sofia.cantidadReseniasOrganizador).toBe(1);
    expect(lucas.puntajeOrganizador).toBe(4.75);
    expect(lucas.cantidadReseniasOrganizador).toBe(2);
    expect(mateo.puntajeOrganizador).toBe(0);
    expect(mateo.cantidadReseniasOrganizador).toBe(0);
  });

  test("obtiene el detalle del usuario con favoritos y eventos organizados enriquecidos", () => {
    const sofia = usuarioService.obtenerUsuarioPorId(1);

    expect(sofia.nombre).toBe("Sofía");
    expect(sofia.favoritos).toHaveLength(1);
    expect(sofia.favoritos[0].puntajeOrganizador).toBe(4.75);
    expect(typeof sofia.favoritos[0].yaOcurrio).toBe("boolean");

    expect(sofia.eventosOrganizados.length).toBeGreaterThanOrEqual(3);
    expect(sofia.eventosOrganizados[0].puntajeOrganizador).toBe(4);
    expect(typeof sofia.eventosOrganizados[0].yaOcurrio).toBe("boolean");
    expect(sofia.reseniasRecibidas).toHaveLength(1);
    expect(sofia.reseniasOrganizador).toHaveLength(1);

    expect(() => usuarioService.obtenerUsuarioPorId(99999)).toThrow(EntityNotFoundError);
  });

  test("permite agregar y quitar favoritos mediante toggle y rechaza ids inexistentes", () => {
    const activado = usuarioService.toggleFavorito(1, 5);
    expect(activado.esFavorito).toBe(true);
    expect(activado.favoritosIds).toContain(5);

    const desactivado = usuarioService.toggleFavorito(1, 5);
    expect(desactivado.esFavorito).toBe(false);
    expect(desactivado.favoritosIds).not.toContain(5);

    expect(() => usuarioService.toggleFavorito(99999, 5)).toThrow(EntityNotFoundError);
    expect(() => usuarioService.toggleFavorito(1, 99999)).toThrow(EntityNotFoundError);
  });
});
