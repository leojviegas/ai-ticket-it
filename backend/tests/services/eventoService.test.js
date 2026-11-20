import { seedDemo } from "../../data/seeders/demoSeeder.js";
import { eventoService } from "../../src/services/index.js";
import { BusinessRuleError } from "../../src/services/errors/ServiceError.js";

describe("EventoService", () => {
  beforeEach(() => {
    seedDemo();
  });

  test("busca eventos por texto sin distinguir tildes ni mayúsculas y filtra por categoría", () => {
    const porTexto = eventoService.listarEventos({ q: "acustica" });
    expect(porTexto).toHaveLength(1);
    expect(porTexto[0].nombre).toBe("Noche Acústica 2025");

    const porCategoria = eventoService.listarEventos({ categoriaId: 2 }); // Teatro
    expect(porCategoria.every((e) => e.categoria.id === 2)).toBe(true);
    expect(porCategoria.length).toBeGreaterThanOrEqual(2);
  });

  test("filtra por rango de precio utilizando tuPrecioEstaEntre", () => {
    const filtrados = eventoService.listarEventos({ precioMin: 40000, precioMax: 50000 });
    expect(filtrados.map((e) => e.nombre)).toContain("Festival Indie Primavera");
    expect(filtrados.map((e) => e.nombre)).not.toContain("Copa Ciudad Nocturna");
  });

  test("ordena eventos por precio mínimo, fecha y puntaje del organizador", () => {
    const porPrecioAsc = eventoService.listarEventos({ ordenarPor: "precio", orden: "asc" });
    for (let i = 1; i < porPrecioAsc.length; i += 1) {
      expect(porPrecioAsc[i].precioMinimo).toBeGreaterThanOrEqual(porPrecioAsc[i - 1].precioMinimo);
    }

    const porFechaAsc = eventoService.listarEventos({ ordenarPor: "fecha", orden: "asc" });
    for (let i = 1; i < porFechaAsc.length; i += 1) {
      expect(new Date(porFechaAsc[i].fecha).getTime()).toBeGreaterThanOrEqual(
        new Date(porFechaAsc[i - 1].fecha).getTime()
      );
    }

    const porPuntajeDesc = eventoService.listarEventos({ ordenarPor: "puntaje" });
    // Lucas tiene promedio 4.75 ((5 + 4.5) / 2), Sofía 4.0, Valentina 3.5
    expect(porPuntajeDesc[0].puntajeOrganizador).toBe(4.75);
    for (let i = 1; i < porPuntajeDesc.length; i += 1) {
      expect(porPuntajeDesc[i].puntajeOrganizador).toBeLessThanOrEqual(
        porPuntajeDesc[i - 1].puntajeOrganizador
      );
    }
  });

  test("obtiene detalle del evento con reseñas propias, reseñas históricas del organizador y puntajes calculados al vuelo", () => {
    const detalle = eventoService.obtenerEventoDetalle(4); // Festival Indie Primavera (Lucas)
    expect(detalle.puntajeEvento).toBe(0);
    expect(detalle.reseniasEvento).toHaveLength(0);
    expect(detalle.puntajeOrganizador).toBe(4.75);
    expect(detalle.reseniasOrganizador).toHaveLength(2);
    expect(detalle.reseniasOrganizador[0].eventoNombre).toBe("Noche Acústica 2025");
  });

  test("crea un nuevo evento con múltiples tipos de entrada y expone compras y cupos remanentes", () => {
    const nuevo = eventoService.crearEvento({
      nombre: "Recital Electrónico",
      descripcion: "DJs en vivo toda la noche",
      categoriaId: 1,
      organizadorId: 1,
      fecha: new Date(Date.now() + 86400000 * 30).toISOString(),
      tiposEntrada: [
        { nombre: "General", descripcion: "Pista", precio: 12000, cupo: 100 },
        { nombre: "Backstage", descripcion: "Acceso VIP", precio: 30000, cupo: 10 },
      ],
    });

    expect(nuevo.nombre).toBe("Recital Electrónico");
    expect(nuevo.tiposEntrada).toHaveLength(2);
    expect(nuevo.precioMinimo).toBe(12000);

    const panel = eventoService.obtenerComprasYDisponibilidad(4);
    expect(panel.disponibilidadPorTipo).toHaveLength(2);
    expect(panel.disponibilidadPorTipo[0].cupoDisponible).toBe(118); // 120 - 2 de compra confirmada
    expect(panel.disponibilidadPorTipo[0].entradasVendidas).toBe(2);
    expect(panel.disponibilidadPorTipo[0].entradasReservadas).toBe(0);
    expect(panel.compras.length).toBeGreaterThanOrEqual(2);
  });

  test("filtra eventos futuros con soloFuturos, expone yaOcurrio y valida rango de precios", () => {
    const todos = eventoService.listarEventos();
    expect(todos.some((e) => e.yaOcurrio === true)).toBe(true);
    expect(todos.some((e) => e.yaOcurrio === false)).toBe(true);

    const futuros = eventoService.listarEventos({ soloFuturos: true });
    expect(futuros.every((e) => e.yaOcurrio === false)).toBe(true);
    expect(futuros).toHaveLength(4);

    expect(() => eventoService.listarEventos({ precioMin: 30000, precioMax: 10000 })).toThrow(
      BusinessRuleError
    );
  });

  test("rechaza crear eventos con fecha pasada o tiposEntrada duplicados y deja al final organizadores sin reseñas al ordenar por puntaje", () => {
    expect(() =>
      eventoService.crearEvento({
        nombre: "Evento Pasado",
        descripcion: "Fecha vencida",
        categoriaId: 1,
        organizadorId: 4,
        fecha: new Date(Date.now() - 86400000).toISOString(),
        tiposEntrada: [{ nombre: "General", descripcion: "Acceso", precio: 5000, cupo: 10 }],
      })
    ).toThrow(BusinessRuleError);

    expect(() =>
      eventoService.crearEvento({
        nombre: "Evento Duplicado",
        descripcion: "Tipos repetidos",
        categoriaId: 1,
        organizadorId: 4,
        fecha: new Date(Date.now() + 86400000 * 5).toISOString(),
        tiposEntrada: [
          { nombre: "General", descripcion: "A", precio: 5000, cupo: 10 },
          { nombre: " general ", descripcion: "B", precio: 8000, cupo: 5 },
        ],
      })
    ).toThrow(BusinessRuleError);

    // Mateo (4) no tiene reseñas como organizador; al crear un evento suyo debe quedar último incluso ordenando asc
    const deMateo = eventoService.crearEvento({
      nombre: "Meetup de Mateo",
      descripcion: "Organizador sin reseñas",
      categoriaId: 4,
      organizadorId: 4,
      fecha: new Date(Date.now() + 86400000 * 15).toISOString(),
      tiposEntrada: [{ nombre: "General", descripcion: "Acceso", precio: 5000, cupo: 30 }],
    });

    const ordenAsc = eventoService.listarEventos({ ordenarPor: "puntaje", orden: "asc" });
    expect(ordenAsc.at(-1).id).toBe(deMateo.id);

    const ordenDesc = eventoService.listarEventos({ ordenarPor: "puntaje", orden: "desc" });
    expect(ordenDesc.at(-1).id).toBe(deMateo.id);
  });

  test("separa entradasVendidas de entradasReservadas, valida organizadorId en panel y filtra reseñas anteriores", () => {
    // Evento 5 (AI & Software Summit de Sofía 1) tiene compra 6 en PENDIENTE (cantidad 1)
    const panel = eventoService.obtenerComprasYDisponibilidad(5, { organizadorId: 1 });
    expect(panel.disponibilidadPorTipo[0].entradasVendidas).toBe(0);
    expect(panel.disponibilidadPorTipo[0].entradasReservadas).toBe(1);

    expect(() =>
      eventoService.obtenerComprasYDisponibilidad(5, { organizadorId: 2 })
    ).toThrow(BusinessRuleError);

    // Evento pasado 1 (de Lucas) no duplica sus propias reseñas en reseniasEventosAnterioresOrganizador
    const detallePasado = eventoService.obtenerEventoDetalle(1);
    expect(detallePasado.reseniasEvento).toHaveLength(2);
    expect(detallePasado.reseniasEventosAnterioresOrganizador).toHaveLength(0);

    // Evento futuro 4 (de Lucas) sí incluye las reseñas anteriores en reseniasEventosAnterioresOrganizador
    const detalleFuturo = eventoService.obtenerEventoDetalle(4);
    expect(detalleFuturo.reseniasEventosAnterioresOrganizador).toHaveLength(2);
  });
});
