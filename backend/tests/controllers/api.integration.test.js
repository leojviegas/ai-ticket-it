import http from "node:http";
import { createApp } from "../../src/app.js";
import { seedDemo } from "../../data/seeders/demoSeeder.js";

function request(server, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    const payload = body !== null ? JSON.stringify(body) : null;

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method,
        headers: payload
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(payload),
            }
          : {},
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          const json = raw ? JSON.parse(raw) : null;
          resolve({ status: res.statusCode, body: json });
        });
      }
    );

    req.on("error", reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

describe("API REST Integration (Express)", () => {
  let server;

  beforeAll((done) => {
    const app = createApp();
    server = http.createServer(app).listen(0, "127.0.0.1", done);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    seedDemo();
  });

  test("GET /api/health, /api/categorias, /api/usuarios y favoritos", async () => {
    const health = await request(server, "GET", "/api/health");
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ status: "ok", storage: "in-memory" });

    const cats = await request(server, "GET", "/api/categorias");
    expect(cats.status).toBe(200);
    expect(cats.body).toHaveLength(5);

    const usuarios = await request(server, "GET", "/api/usuarios");
    expect(usuarios.status).toBe(200);
    expect(usuarios.body).toHaveLength(4);

    const favOn = await request(server, "POST", "/api/usuarios/1/favoritos", { eventoId: 5 });
    expect(favOn.status).toBe(200);
    expect(favOn.body.esFavorito).toBe(true);

    const favOff = await request(server, "POST", "/api/usuarios/1/favoritos", { eventoId: 5 });
    expect(favOff.status).toBe(200);
    expect(favOff.body.esFavorito).toBe(false);
  });

  test("flujo completo HTTP: crear evento -> comprar -> confirmar -> chat -> cancelar -> reembolsar", async () => {
    // 1. Organizador (Sofía 1) crea evento
    const createdEvent = await request(server, "POST", "/api/eventos", {
      nombre: "Show de Jazz en Vivo",
      descripcion: "Cuarteto internacional",
      categoriaId: 1,
      organizadorId: 1,
      fecha: new Date(Date.now() + 86400000 * 10).toISOString(),
      tiposEntrada: [
        { nombre: "Mesa", descripcion: "Con consumición", precio: 20000, cupo: 10 },
      ],
    });
    expect(createdEvent.status).toBe(201);
    const eventoId = createdEvent.body.id;
    const tipoEntradaId = createdEvent.body.tiposEntrada[0].id;

    // 2. Comprador (Mateo 4) compra 2 entradas -> nace PENDIENTE
    const compra = await request(server, "POST", "/api/compras", {
      compradorId: 4,
      eventoId,
      tipoEntradaId,
      cantidad: 2,
    });
    expect(compra.status).toBe(201);
    expect(compra.body.estado).toBe("PENDIENTE");
    const compraId = compra.body.id;

    // 3. Organizador (Sofía 1) confirma compra -> pasa a CONFIRMADA y calcula días faltantes
    const confirmada = await request(server, "PATCH", `/api/compras/${compraId}/estado`, {
      estado: "CONFIRMADA",
      usuarioId: 1,
    });
    expect(confirmada.status).toBe(200);
    expect(confirmada.body.estado).toBe("CONFIRMADA");
    expect(confirmada.body.diasParaEvento).toBeGreaterThanOrEqual(9);

    // 4. Chat entre comprador y organizador
    const msg = await request(server, "POST", `/api/compras/${compraId}/mensajes`, {
      usuarioId: 4,
      mensaje: "¿A qué hora conviene llegar?",
    });
    expect(msg.status).toBe(201);
    expect(msg.body.compra.mensajes).toHaveLength(1);

    // 5. Comprador cancela -> pasa a CANCELADA y devuelve cupo (vuelve a 10)
    const cancelada = await request(server, "POST", `/api/compras/${compraId}/cancelar`, {
      usuarioId: 4,
    });
    expect(cancelada.status).toBe(200);
    expect(cancelada.body.estado).toBe("CANCELADA");

    const panel = await request(server, "GET", `/api/eventos/${eventoId}/compras`);
    expect(panel.status).toBe(200);
    expect(panel.body.disponibilidadPorTipo[0].cupoDisponible).toBe(10);

    // 6. Organizador reembolsa -> pasa a REEMBOLSADA
    const reembolsada = await request(server, "POST", `/api/compras/${compraId}/reembolsar`, {
      usuarioId: 1,
    });
    expect(reembolsada.status).toBe(200);
    expect(reembolsada.body.estado).toBe("REEMBOLSADA");
  });

  test("devuelve códigos de error HTTP correctos (400 validación, 404 inexistente, 409 conflicto)", async () => {
    const badReq = await request(server, "POST", "/api/eventos", { nombre: "" });
    expect(badReq.status).toBe(400);

    const notFound = await request(server, "GET", "/api/eventos/99999");
    expect(notFound.status).toBe(404);

    const unknownRoute = await request(server, "GET", "/api/no-existe");
    expect(unknownRoute.status).toBe(404);

    // Conflicto 409: intentar confirmar compra 7 que ya está CANCELADA
    const conflict = await request(server, "PATCH", "/api/compras/7/estado", {
      estado: "CONFIRMADA",
      usuarioId: 2,
    });
    expect(conflict.status).toBe(409);

    // Crear reseña válida (201) y duplicada (409)
    const resOk = await request(server, "POST", "/api/resenias", {
      compradorId: 4,
      eventoId: 1,
      puntuacion: 5,
      detalle: "Espectacular show",
    });
    expect(resOk.status).toBe(201);

    const resDup = await request(server, "POST", "/api/resenias", {
      compradorId: 4,
      eventoId: 1,
      puntuacion: 4,
      detalle: "Duplicada",
    });
    expect(resDup.status).toBe(409);

    const resOrg = await request(server, "GET", "/api/organizadores/2/resenias");
    expect(resOrg.status).toBe(200);
    expect(resOrg.body.cantidadResenias).toBe(3);
  });

  test("protege las 4 fallas críticas por HTTP (cancelación por PATCH, evento pasado, auto-compra y query params vacíos)", async () => {
    // 1. No permite cancelar vía PATCH /api/compras/:id/estado
    const cancelViaPatch = await request(server, "PATCH", "/api/compras/5/estado", {
      estado: "CANCELADA",
      usuarioId: 2,
    });
    expect(cancelViaPatch.status).toBe(400);

    const compra5 = await request(server, "GET", "/api/compras/5");
    expect(compra5.status).toBe(200);
    expect(compra5.body.estado).toBe("CONFIRMADA");

    // 2. No permite comprar entradas de un evento pasado
    const compraPasada = await request(server, "POST", "/api/compras", {
      compradorId: 4,
      eventoId: 1,
      tipoEntradaId: 101,
      cantidad: 1,
    });
    expect(compraPasada.status).toBe(400);

    // 3. No permite que el organizador compre entradas de su propio evento
    const autoCompra = await request(server, "POST", "/api/compras", {
      compradorId: 2,
      eventoId: 4,
      tipoEntradaId: 201,
      cantidad: 1,
    });
    expect(autoCompra.status).toBe(400);

    // 4. Query params vacíos en eventos y compras no rompen ni filtran a 0
    const eventosVacios = await request(
      server,
      "GET",
      "/api/eventos?q=&categoriaId=&organizadorId=&precioMin=&precioMax=&ordenarPor=&orden="
    );
    expect(eventosVacios.status).toBe(200);
    expect(eventosVacios.body).toHaveLength(7);

    const eventosPrecioMaxVacio = await request(server, "GET", "/api/eventos?precioMax=");
    expect(eventosPrecioMaxVacio.status).toBe(200);
    expect(eventosPrecioMaxVacio.body).toHaveLength(7);

    const catCero = await request(server, "GET", "/api/eventos?categoriaId=0");
    expect(catCero.status).toBe(400);

    const precioNeg = await request(server, "GET", "/api/eventos?precioMax=-1");
    expect(precioNeg.status).toBe(400);

    const comprasVacias = await request(server, "GET", "/api/compras?compradorId=&eventoId=");
    expect(comprasVacias.status).toBe(200);
    expect(comprasVacias.body).toHaveLength(9);

    const compradorCero = await request(server, "GET", "/api/compras?compradorId=0");
    expect(compradorCero.status).toBe(400);
  });

  test("cubre las mejoras de contratos, filtros, multimedia, reseñas y acceso en endpoints HTTP", async () => {
    const reseniasSofia = await request(server, "GET", "/api/resenias?compradorId=1");
    expect(reseniasSofia.status).toBe(200);
    expect(reseniasSofia.body).toHaveLength(1);

    const usuario1 = await request(server, "GET", "/api/usuarios/1");
    expect(usuario1.status).toBe(200);
    expect(usuario1.body.favoritos[0].puntajeOrganizador).toBeDefined();
    expect(usuario1.body.eventosOrganizados[0].puntajeOrganizador).toBeDefined();
    expect(usuario1.body.reseniasOrganizador).toHaveLength(1);

    const multimediaInvalida = await request(server, "POST", "/api/eventos", {
      nombre: "Show con URL mala",
      descripcion: "Prueba validación",
      categoriaId: 1,
      organizadorId: 1,
      fecha: new Date(Date.now() + 86400000 * 5).toISOString(),
      multimedia: ["no-es-una-url"],
      tiposEntrada: [{ nombre: "General", descripcion: "Campo", precio: 5000, cupo: 10 }],
    });
    expect(multimediaInvalida.status).toBe(400);

    const soloFuturos = await request(server, "GET", "/api/eventos?soloFuturos=true");
    expect(soloFuturos.status).toBe(200);
    expect(soloFuturos.body).toHaveLength(4);

    const detalleFuturo = await request(server, "GET", "/api/eventos/4");
    expect(detalleFuturo.status).toBe(200);
    expect(detalleFuturo.body.reseniasEventosAnterioresOrganizador).toHaveLength(2);

    const compraAjena = await request(server, "GET", "/api/compras/2?usuarioId=3");
    expect(compraAjena.status).toBe(400);

    const panelAjeno = await request(server, "GET", "/api/eventos/5/compras?organizadorId=2");
    expect(panelAjeno.status).toBe(400);
  });

  test("valida que los parámetros :id en rutas sean enteros positivos devolviendo 400 Bad Request", async () => {
    const endpointsInvalidos = [
      ["GET", "/api/eventos/abc"],
      ["GET", "/api/eventos/0/compras"],
      ["GET", "/api/usuarios/-1"],
      ["POST", "/api/usuarios/abc/favoritos", { eventoId: 4 }],
      ["GET", "/api/compras/1.5"],
      ["PATCH", "/api/compras/abc/estado", { estado: "CONFIRMADA", usuarioId: 1 }],
      ["POST", "/api/compras/0/cancelar", { usuarioId: 1 }],
      ["POST", "/api/compras/-3/reembolsar", { usuarioId: 1 }],
      ["POST", "/api/compras/abc/mensajes", { usuarioId: 1, mensaje: "Hola" }],
      ["GET", "/api/organizadores/abc/resenias"],
    ];

    for (const [method, path, body] of endpointsInvalidos) {
      const res = await request(server, method, path, body ?? null);
      expect(res.status).toBe(400);
    }
  });
});
