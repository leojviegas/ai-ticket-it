import { seedDemo } from "../../data/seeders/demoSeeder.js";
import { eventoService } from "../../src/services/index.js";

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
    expect(panel.compras.length).toBeGreaterThanOrEqual(2);
  });
});
