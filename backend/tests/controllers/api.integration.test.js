import http from "node:http";
import { createApp } from "../../src/app.js";
import { seedDemo, DEMO_PASSWORD } from "../../data/seeders/demoSeeder.js";
import { usuarioRepository } from "../../src/repositories/index.js";
import { authService } from "../../src/services/index.js";

function request(server, method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    const payload = body !== null ? JSON.stringify(body) : null;

    const headers = {};
    if (payload) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(payload);
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method,
        headers,
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

function tokenParaUsuario(id) {
  const usuario = usuarioRepository.findByIdOrThrow(id);
  return authService.generarAccessToken(usuario);
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

  test("GET /api/health, /api/categorias, /api/usuarios y favoritos (protegido con requireAuth)", async () => {
    const health = await request(server, "GET", "/api/health");
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ status: "ok", storage: "in-memory" });

    const cats = await request(server, "GET", "/api/categorias");
    expect(cats.status).toBe(200);
    expect(cats.body).toHaveLength(5);

    const usuarios = await request(server, "GET", "/api/usuarios");
    expect(usuarios.status).toBe(200);
    expect(usuarios.body).toHaveLength(4);

    const tokenSofia = tokenParaUsuario(1);
    const tokenMateo = tokenParaUsuario(4);

    // Sin token -> 401
    const favSinToken = await request(server, "POST", "/api/usuarios/1/favoritos", { eventoId: 5 });
    expect(favSinToken.status).toBe(401);

    // Token de otro usuario -> 403
    const favAjeno = await request(
      server,
      "POST",
      "/api/usuarios/1/favoritos",
      { eventoId: 5 },
      tokenMateo
    );
    expect(favAjeno.status).toBe(403);

    const favOn = await request(
      server,
      "POST",
      "/api/usuarios/1/favoritos",
      { eventoId: 5 },
      tokenSofia
    );
    expect(favOn.status).toBe(200);
    expect(favOn.body.esFavorito).toBe(true);

    const favOff = await request(
      server,
      "POST",
      "/api/usuarios/1/favoritos",
      { eventoId: 5 },
      tokenSofia
    );
    expect(favOff.status).toBe(200);
    expect(favOff.body.esFavorito).toBe(false);
  });

  test("flujo completo HTTP autenticado: crear evento -> comprar -> confirmar -> chat -> cancelar -> reembolsar", async () => {
    const tokenSofia = tokenParaUsuario(1);
    const tokenMateo = tokenParaUsuario(4);

    // 1. Organizador (Sofía 1) crea evento sin necesidad de pasar organizadorId en body
    const createdEvent = await request(
      server,
      "POST",
      "/api/eventos",
      {
        nombre: "Show de Jazz en Vivo",
        descripcion: "Cuarteto internacional",
        categoriaId: 1,
        fecha: new Date(Date.now() + 86400000 * 10).toISOString(),
        tiposEntrada: [
          { nombre: "Mesa", descripcion: "Con consumición", precio: 20000, cupo: 10 },
        ],
      },
      tokenSofia
    );
    expect(createdEvent.status).toBe(201);
    expect(createdEvent.body.organizador.id).toBe(1);
    const eventoId = createdEvent.body.id;
    const tipoEntradaId = createdEvent.body.tiposEntrada[0].id;

    // 2. Comprador (Mateo 4) compra 2 entradas -> nace PENDIENTE
    const compra = await request(
      server,
      "POST",
      "/api/compras",
      {
        eventoId,
        tipoEntradaId,
        cantidad: 2,
      },
      tokenMateo
    );
    expect(compra.status).toBe(201);
    expect(compra.body.estado).toBe("PENDIENTE");
    expect(compra.body.comprador.id).toBe(4);
    const compraId = compra.body.id;

    // 3. Organizador (Sofía 1) confirma compra -> pasa a CONFIRMADA y calcula días faltantes
    const confirmada = await request(
      server,
      "PATCH",
      `/api/compras/${compraId}/estado`,
      { estado: "CONFIRMADA" },
      tokenSofia
    );
    expect(confirmada.status).toBe(200);
    expect(confirmada.body.estado).toBe("CONFIRMADA");
    expect(confirmada.body.diasParaEvento).toBeGreaterThanOrEqual(9);

    // 4. Chat entre comprador y organizador
    const msg = await request(
      server,
      "POST",
      `/api/compras/${compraId}/mensajes`,
      { mensaje: "¿A qué hora conviene llegar?" },
      tokenMateo
    );
    expect(msg.status).toBe(201);
    expect(msg.body.compra.mensajes).toHaveLength(1);

    // 5. Comprador cancela -> pasa a CANCELADA y devuelve cupo (vuelve a 10)
    const cancelada = await request(
      server,
      "POST",
      `/api/compras/${compraId}/cancelar`,
      {},
      tokenMateo
    );
    expect(cancelada.status).toBe(200);
    expect(cancelada.body.estado).toBe("CANCELADA");

    const panel = await request(server, "GET", `/api/eventos/${eventoId}/compras`, null, tokenSofia);
    expect(panel.status).toBe(200);
    expect(panel.body.disponibilidadPorTipo[0].cupoDisponible).toBe(10);

    // 6. Organizador reembolsa -> pasa a REEMBOLSADA
    const reembolsada = await request(
      server,
      "POST",
      `/api/compras/${compraId}/reembolsar`,
      {},
      tokenSofia
    );
    expect(reembolsada.status).toBe(200);
    expect(reembolsada.body.estado).toBe("REEMBOLSADA");
  });

  test("devuelve códigos de error HTTP correctos (400 validación, 401 sin token, 403 suplantación, 404 inexistente, 409 conflicto)", async () => {
    const tokenSofia = tokenParaUsuario(1);
    const tokenLucas = tokenParaUsuario(2);
    const tokenMateo = tokenParaUsuario(4);

    // Sin token en ruta protegida -> 401
    const sinToken = await request(server, "POST", "/api/eventos", { nombre: "Sin Auth" });
    expect(sinToken.status).toBe(401);

    // Suplantación de identidad (Mateo intentando crear evento como Sofía) -> 403
    const suplantacion = await request(
      server,
      "POST",
      "/api/eventos",
      {
        nombre: "Evento ajeno",
        descripcion: "Intento de suplantación",
        categoriaId: 1,
        organizadorId: 1,
        fecha: new Date(Date.now() + 86400000 * 5).toISOString(),
        tiposEntrada: [{ nombre: "General", descripcion: "Campo", precio: 5000, cupo: 10 }],
      },
      tokenMateo
    );
    expect(suplantacion.status).toBe(403);

    const badReq = await request(server, "POST", "/api/eventos", { nombre: "" }, tokenSofia);
    expect(badReq.status).toBe(400);

    const notFound = await request(server, "GET", "/api/eventos/99999");
    expect(notFound.status).toBe(404);

    const unknownRoute = await request(server, "GET", "/api/no-existe");
    expect(unknownRoute.status).toBe(404);

    // Conflicto 409: intentar confirmar compra 7 que ya está CANCELADA (Lucas es organizador de evento 4)
    const conflict = await request(
      server,
      "PATCH",
      "/api/compras/7/estado",
      { estado: "CONFIRMADA" },
      tokenLucas
    );
    expect(conflict.status).toBe(409);

    // Crear reseña válida (201) y duplicada (409) como Mateo (id 4)
    const resOk = await request(
      server,
      "POST",
      "/api/resenias",
      {
        eventoId: 1,
        puntuacion: 5,
        detalle: "Espectacular show",
      },
      tokenMateo
    );
    expect(resOk.status).toBe(201);

    const resDup = await request(
      server,
      "POST",
      "/api/resenias",
      {
        eventoId: 1,
        puntuacion: 4,
        detalle: "Duplicada",
      },
      tokenMateo
    );
    expect(resDup.status).toBe(409);

    const resOrg = await request(server, "GET", "/api/organizadores/2/resenias");
    expect(resOrg.status).toBe(200);
    expect(resOrg.body.cantidadResenias).toBe(3);
  });

  test("protege las 4 fallas críticas por HTTP (cancelación por PATCH, evento pasado, auto-compra y query params vacíos)", async () => {
    const tokenSofia = tokenParaUsuario(1);
    const tokenLucas = tokenParaUsuario(2);
    const tokenMateo = tokenParaUsuario(4);

    // 1. No permite cancelar ni marcar UTILIZADA manualmente vía PATCH /api/compras/:id/estado
    const cancelViaPatch = await request(
      server,
      "PATCH",
      "/api/compras/5/estado",
      { estado: "CANCELADA" },
      tokenLucas
    );
    expect(cancelViaPatch.status).toBe(400);

    const utilizadaViaPatch = await request(
      server,
      "PATCH",
      "/api/compras/5/estado",
      { estado: "UTILIZADA" },
      tokenLucas
    );
    expect(utilizadaViaPatch.status).toBe(400);

    // Organizador Lucas sí puede cancelar una compra CONFIRMADA antes del evento
    const compraParaCancelarOrg = await request(
      server,
      "POST",
      "/api/compras",
      {
        eventoId: 4,
        tipoEntradaId: 201,
        cantidad: 1,
      },
      tokenMateo
    );
    expect(compraParaCancelarOrg.status).toBe(201);
    const confirmadaOrg = await request(
      server,
      "PATCH",
      `/api/compras/${compraParaCancelarOrg.body.id}/estado`,
      { estado: "CONFIRMADA" },
      tokenLucas
    );
    expect(confirmadaOrg.status).toBe(200);
    const canceladaPorOrg = await request(
      server,
      "POST",
      `/api/compras/${compraParaCancelarOrg.body.id}/cancelar`,
      {},
      tokenLucas
    );
    expect(canceladaPorOrg.status).toBe(200);
    expect(canceladaPorOrg.body.estado).toBe("CANCELADA");

    const compra5 = await request(server, "GET", "/api/compras/5", null, tokenSofia);
    expect(compra5.status).toBe(200);
    expect(compra5.body.estado).toBe("CONFIRMADA");

    // 2. No permite comprar entradas de un evento pasado
    const compraPasada = await request(
      server,
      "POST",
      "/api/compras",
      {
        eventoId: 1,
        tipoEntradaId: 101,
        cantidad: 1,
      },
      tokenMateo
    );
    expect(compraPasada.status).toBe(400);

    // 3. No permite que el organizador compre entradas de su propio evento
    const autoCompra = await request(
      server,
      "POST",
      "/api/compras",
      {
        eventoId: 4,
        tipoEntradaId: 201,
        cantidad: 1,
      },
      tokenLucas
    );
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

    // Sofía tiene 2 compras propias en el seeder (compras 1 y 5)
    const comprasVacias = await request(
      server,
      "GET",
      "/api/compras?compradorId=&eventoId=",
      null,
      tokenSofia
    );
    expect(comprasVacias.status).toBe(200);
    expect(comprasVacias.body).toHaveLength(2);

    const compradorCero = await request(
      server,
      "GET",
      "/api/compras?compradorId=0",
      null,
      tokenSofia
    );
    expect(compradorCero.status).toBe(400);
  });

  test("cubre las mejoras de contratos, filtros, multimedia, reseñas y acceso en endpoints HTTP", async () => {
    const tokenSofia = tokenParaUsuario(1);
    const tokenLucas = tokenParaUsuario(2);
    const tokenValentina = tokenParaUsuario(3);

    const reseniasSofia = await request(server, "GET", "/api/resenias?compradorId=1");
    expect(reseniasSofia.status).toBe(200);
    expect(reseniasSofia.body).toHaveLength(1);

    const usuario1 = await request(server, "GET", "/api/usuarios/1");
    expect(usuario1.status).toBe(200);
    expect(usuario1.body.favoritos[0].puntajeOrganizador).toBeDefined();
    expect(usuario1.body.eventosOrganizados[0].puntajeOrganizador).toBeDefined();
    expect(usuario1.body.reseniasOrganizador).toHaveLength(1);

    const multimediaInvalida = await request(
      server,
      "POST",
      "/api/eventos",
      {
        nombre: "Show con URL mala",
        descripcion: "Prueba validación",
        categoriaId: 1,
        fecha: new Date(Date.now() + 86400000 * 5).toISOString(),
        multimedia: ["no-es-una-url"],
        tiposEntrada: [{ nombre: "General", descripcion: "Campo", precio: 5000, cupo: 10 }],
      },
      tokenSofia
    );
    expect(multimediaInvalida.status).toBe(400);

    const soloFuturos = await request(server, "GET", "/api/eventos?soloFuturos=true");
    expect(soloFuturos.status).toBe(200);
    expect(soloFuturos.body).toHaveLength(4);

    const detalleFuturo = await request(server, "GET", "/api/eventos/4");
    expect(detalleFuturo.status).toBe(200);
    expect(detalleFuturo.body.reseniasEventosAnterioresOrganizador).toHaveLength(2);

    // Valentina (id 3) intenta ver compra 2 (de Mateo en evento de Lucas) -> 400
    const compraAjena = await request(server, "GET", "/api/compras/2", null, tokenValentina);
    expect(compraAjena.status).toBe(400);

    // Lucas (id 2) intenta ver panel de ventas del evento 5 (de Sofía) -> 400
    const panelAjeno = await request(server, "GET", "/api/eventos/5/compras", null, tokenLucas);
    expect(panelAjeno.status).toBe(400);
  });

  test("valida que los parámetros :id en rutas sean enteros positivos devolviendo 400 Bad Request", async () => {
    const tokenSofia = tokenParaUsuario(1);
    const endpointsInvalidos = [
      ["GET", "/api/eventos/abc", null, null],
      ["GET", "/api/eventos/0/compras", null, tokenSofia],
      ["GET", "/api/usuarios/-1", null, null],
      ["POST", "/api/usuarios/abc/favoritos", { eventoId: 4 }, tokenSofia],
      ["GET", "/api/compras/1.5", null, tokenSofia],
      ["PATCH", "/api/compras/abc/estado", { estado: "CONFIRMADA" }, tokenSofia],
      ["POST", "/api/compras/0/cancelar", {}, tokenSofia],
      ["POST", "/api/compras/-3/reembolsar", {}, tokenSofia],
      ["POST", "/api/compras/abc/mensajes", { mensaje: "Hola" }, tokenSofia],
      ["GET", "/api/organizadores/abc/resenias", null, null],
    ];

    for (const [method, path, body, token] of endpointsInvalidos) {
      const res = await request(server, method, path, body, token);
      expect(res.status).toBe(400);
    }
  });

  test("flujo HTTP de autenticación: POST /api/auth/register, POST /api/auth/login y GET /api/auth/me", async () => {
    const registro = await request(server, "POST", "/api/auth/register", {
      nombre: "Camila",
      apellido: "Vega",
      email: "Camila@Example.com",
      password: "Password123",
    });
    expect(registro.status).toBe(201);
    expect(registro.body.accessToken).toEqual(expect.any(String));
    expect(registro.body.usuario).toMatchObject({
      nombre: "Camila",
      apellido: "Vega",
      email: "camila@example.com",
    });
    expect(registro.body.usuario.passwordHash).toBeUndefined();

    // GET /api/auth/me sin token -> 401
    const meSinToken = await request(server, "GET", "/api/auth/me");
    expect(meSinToken.status).toBe(401);

    // GET /api/auth/me con token válido -> 200
    const meOk = await request(server, "GET", "/api/auth/me", null, registro.body.accessToken);
    expect(meOk.status).toBe(200);
    expect(meOk.body).toEqual(registro.body.usuario);

    // Login con usuario del seeder (Sofía) -> 200 y luego /auth/me
    const loginSeeder = await request(server, "POST", "/api/auth/login", {
      email: "sofia@ticketit.com",
      password: DEMO_PASSWORD,
    });
    expect(loginSeeder.status).toBe(200);
    expect(loginSeeder.body.usuario.id).toBe(1);

    const meSofia = await request(server, "GET", "/api/auth/me", null, loginSeeder.body.accessToken);
    expect(meSofia.status).toBe(200);
    expect(meSofia.body.email).toBe("sofia@ticketit.com");

    // Email duplicado -> 409
    const registroDuplicado = await request(server, "POST", "/api/auth/register", {
      nombre: "Camila",
      apellido: "Vega",
      email: "camila@example.com",
      password: "Password123",
    });
    expect(registroDuplicado.status).toBe(409);

    // Registro inválido -> 400
    const registroInvalido = await request(server, "POST", "/api/auth/register", {
      nombre: "",
      apellido: "Vega",
      email: "no-es-email",
      password: "123",
    });
    expect(registroInvalido.status).toBe(400);

    // Login con contraseña incorrecta -> 401
    const loginMal = await request(server, "POST", "/api/auth/login", {
      email: "camila@example.com",
      password: "otraPassword",
    });
    expect(loginMal.status).toBe(401);

    // Login con campos vacíos -> 400
    const loginVacio = await request(server, "POST", "/api/auth/login", {
      email: "",
      password: "",
    });
    expect(loginVacio.status).toBe(400);

    // GET /api/auth/me tras reinicio/borrado del usuario en memoria -> 401
    usuarioRepository.delete(registro.body.usuario.id);
    const meBorrado = await request(server, "GET", "/api/auth/me", null, registro.body.accessToken);
    expect(meBorrado.status).toBe(401);
  });

  test("soporta filtros estado/soloFuturos en compras, multimedia base64, adjuntos en chat y endpoints GET /api/mensajes", async () => {
    const tokenSofia = tokenParaUsuario(1);
    const tokenValentina = tokenParaUsuario(3);

    // 1. Filtros en GET /api/compras (Sofía tiene compra 5 CONFIRMADA futura y compra 1 UTILIZADA pasada)
    const confirmadasFuturas = await request(
      server,
      "GET",
      "/api/compras?estado=CONFIRMADA&soloFuturos=true",
      null,
      tokenSofia
    );
    expect(confirmadasFuturas.status).toBe(200);
    expect(confirmadasFuturas.body).toHaveLength(1);
    expect(confirmadasFuturas.body[0].id).toBe(5);

    const utilizadasFuturas = await request(
      server,
      "GET",
      "/api/compras?estado=UTILIZADA&soloFuturos=true",
      null,
      tokenSofia
    );
    expect(utilizadasFuturas.status).toBe(200);
    expect(utilizadasFuturas.body).toHaveLength(0);

    // 2. Filtro estado en panel del organizador GET /api/eventos/:id/compras
    const tokenMateo = tokenParaUsuario(4);
    const compraPendienteRes = await request(
      server,
      "POST",
      "/api/compras",
      {
        eventoId: 5,
        tipoEntradaId: 203,
        cantidad: 1,
      },
      tokenMateo
    );
    expect(compraPendienteRes.status).toBe(201);

    await request(
      server,
      "POST",
      `/api/compras/${compraPendienteRes.body.id}/mensajes`,
      { mensaje: "Consulta por mi entrada." },
      tokenMateo
    );

    const panelPendientes = await request(
      server,
      "GET",
      "/api/eventos/5/compras?estado=PENDIENTE",
      null,
      tokenSofia
    );
    expect(panelPendientes.status).toBe(200);
    expect(panelPendientes.body.compras).toHaveLength(1);
    expect(panelPendientes.body.compras[0].id).toBe(compraPendienteRes.body.id);

    const panelConfirmadas = await request(
      server,
      "GET",
      "/api/eventos/5/compras?estado=CONFIRMADA",
      null,
      tokenSofia
    );
    expect(panelConfirmadas.status).toBe(200);
    expect(panelConfirmadas.body.compras).toHaveLength(0);
    // La disponibilidad sigue considerando la compra pendiente aunque se filtre por CONFIRMADA
    expect(panelConfirmadas.body.disponibilidadPorTipo[0].entradasReservadas).toBe(1);

    // 3. Crear evento con imagen PNG en Data URI base64
    const eventoBase64 = await request(
      server,
      "POST",
      "/api/eventos",
      {
        nombre: "Muestra de Arte Digital",
        descripcion: "Galería audiovisual",
        categoriaId: 2,
        fecha: new Date(Date.now() + 86400000 * 8).toISOString(),
        multimedia: ["data:image/png;base64,iVBORw0KGgo="],
        tiposEntrada: [{ nombre: "General", descripcion: "Entrada", precio: 9000, cupo: 25 }],
      },
      tokenSofia
    );
    expect(eventoBase64.status).toBe(201);
    expect(eventoBase64.body.multimedia).toEqual(["data:image/png;base64,iVBORw0KGgo="]);

    // 4. Enviar mensaje con adjunto PDF sin texto y validar rechazo sin texto ni adjunto
    const msgPdf = await request(
      server,
      "POST",
      "/api/compras/5/mensajes",
      {
        adjunto: {
          nombre: "comprobante.pdf",
          tipoMime: "application/pdf",
          contenido: "data:application/pdf;base64,JVBERi0=",
        },
      },
      tokenSofia
    );
    expect(msgPdf.status).toBe(201);
    expect(msgPdf.body.mensaje.remitente.id).toBe(1);
    expect(msgPdf.body.mensaje.destinatario.id).toBe(2);
    expect(msgPdf.body.mensaje.adjunto.nombre).toBe("comprobante.pdf");

    const msgVacio = await request(
      server,
      "POST",
      "/api/compras/5/mensajes",
      { mensaje: "   " },
      tokenSofia
    );
    expect(msgVacio.status).toBe(400);

    // 5. GET /api/mensajes (sin token 401, filtros bidireccionales y permisos 403)
    const msgSinToken = await request(server, "GET", "/api/mensajes");
    expect(msgSinToken.status).toBe(401);

    const msgsConLucas = await request(
      server,
      "GET",
      "/api/mensajes?conUsuarioId=2",
      null,
      tokenSofia
    );
    expect(msgsConLucas.status).toBe(200);
    expect(msgsConLucas.body).toHaveLength(3);

    const msgsCompraPendiente = await request(
      server,
      "GET",
      `/api/mensajes?compraId=${compraPendienteRes.body.id}`,
      null,
      tokenSofia
    );
    expect(msgsCompraPendiente.status).toBe(200);
    expect(msgsCompraPendiente.body).toHaveLength(1);

    const msgsRemitenteLucas = await request(
      server,
      "GET",
      "/api/mensajes?remitenteId=2",
      null,
      tokenSofia
    );
    expect(msgsRemitenteLucas.status).toBe(200);
    expect(msgsRemitenteLucas.body).toHaveLength(1);

    const msgAjeno = await request(
      server,
      "GET",
      "/api/mensajes?remitenteId=1&destinatarioId=2",
      null,
      tokenValentina
    );
    expect(msgAjeno.status).toBe(403);

    const msgCompraAjena = await request(
      server,
      "GET",
      "/api/mensajes?compraId=5",
      null,
      tokenValentina
    );
    expect(msgCompraAjena.status).toBe(403);

    // 6. GET /api/mensajes/conversaciones
    const conversaciones = await request(
      server,
      "GET",
      "/api/mensajes/conversaciones",
      null,
      tokenSofia
    );
    expect(conversaciones.status).toBe(200);
    expect(conversaciones.body).toHaveLength(2);
    expect(conversaciones.body[0].compraId).toBe(5);
    expect(conversaciones.body[0].ultimoMensaje.adjunto.nombre).toBe("comprobante.pdf");

    const todasConversaciones = await request(
      server,
      "GET",
      "/api/mensajes/conversaciones?incluirVacias=true",
      null,
      tokenSofia
    );
    expect(todasConversaciones.status).toBe(200);
    expect(todasConversaciones.body.length).toBeGreaterThan(2);
  });
});
