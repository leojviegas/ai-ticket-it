import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { crearLectorAntigravity, directorioBrainPorDefecto } from "./parser.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_DIR = path.resolve(__dirname, "..", "..");
const REPO_NOMBRE = path.basename(REPO_DIR);
const PUBLIC_DIR = path.join(__dirname, "public");
const PRECIOS_PATH = path.join(__dirname, "precios-modelos.json");
const BRAIN_DIR = directorioBrainPorDefecto();

const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const lector = crearLectorAntigravity({
  brainDir: BRAIN_DIR,
  repoDir: REPO_DIR,
  repoNombre: REPO_NOMBRE,
  preciosPath: PRECIOS_PATH,
});

function parsearFiltros(urlObj) {
  const sp = urlObj.searchParams;
  const alcance = sp.get("alcance") === "todos" ? "todos" : "proyecto";
  const modelo = sp.get("modelo") || undefined;
  const sesion = sp.get("sesion") || undefined;
  const ventanaStr = sp.get("ventana");
  const ventanaMin = ventanaStr && /^\d+$/.test(ventanaStr) && Number(ventanaStr) > 0 ? Number(ventanaStr) : undefined;
  const detalle = sp.get("detalle") === "1" || sp.get("detalle") === "true";
  return { alcance, modelo, sesion, ventanaMin, detalle };
}

function esLoopback(req) {
  const remote = req.socket?.remoteAddress;
  return Boolean(remote && LOOPBACK.has(remote));
}

function servirArchivo(res, filePath) {
  try {
    const contenido = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(contenido);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Archivo no encontrado");
  }
}

// ── Gestión de suscriptores SSE ─────────────────────────────────────────────

const clientesSSE = new Set();

function firmaSnapshot(snapshot) {
  return JSON.stringify({
    kpis: snapshot.kpis,
    enCurso: snapshot.enCurso,
    tokens: snapshot.tokens.total,
    sesiones: snapshot.sesiones.length,
    ultimo: snapshot.porTiempo.puntos.at(-1)?.t ?? null,
    detalle: Boolean(snapshot.comandosRecientes),
  });
}

function notificarClientes() {
  for (const cliente of clientesSSE) {
    try {
      const snapshot = lector.obtenerSnapshot(cliente.filtros);
      const firma = firmaSnapshot(snapshot);
      if (firma !== cliente.ultimaFirma) {
        cliente.ultimaFirma = firma;
        cliente.res.write(`event: metricas\ndata: ${JSON.stringify(snapshot)}\n\n`);
      }
    } catch {
      clientesSSE.delete(cliente);
    }
  }
}

let debounceTimer = null;
function programarNotificacion() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    if (clientesSSE.size > 0) notificarClientes();
  }, 400);
}

let watcher = null;
if (fs.existsSync(BRAIN_DIR)) {
  try {
    watcher = fs.watch(BRAIN_DIR, { recursive: true }, (_eventType, filename) => {
      if (!filename || filename.endsWith("transcript.jsonl")) {
        programarNotificacion();
      }
    });
    watcher.on("error", () => {});
  } catch {
    // En entornos sin fs.watch recursivo queda activo el polling de respaldo
  }
}

const pollingRespaldo = setInterval(() => {
  if (clientesSSE.size > 0) notificarClientes();
}, 3000);
pollingRespaldo.unref();

// ── Servidor HTTP ───────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  if (!esLoopback(req)) {
    res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Las métricas solo se pueden ver desde este equipo" }));
    return;
  }

  const urlObj = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const pathname = urlObj.pathname;

  if (pathname === "/" || pathname === "/metrics/") {
    res.writeHead(302, { Location: "/metrics" });
    res.end();
    return;
  }

  if (pathname === "/metrics") {
    servirArchivo(res, path.join(PUBLIC_DIR, "index.html"));
    return;
  }

  if (pathname === "/metrics/styles.css") {
    servirArchivo(res, path.join(PUBLIC_DIR, "styles.css"));
    return;
  }

  if (pathname === "/metrics/app.js") {
    servirArchivo(res, path.join(PUBLIC_DIR, "app.js"));
    return;
  }

  if (pathname === "/metrics/api") {
    const filtros = parsearFiltros(urlObj);
    const snapshot = lector.obtenerSnapshot(filtros);
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(snapshot));
    return;
  }

  if (pathname === "/metrics/api/events") {
    const filtros = parsearFiltros(urlObj);
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    const snapshot = lector.obtenerSnapshot(filtros);
    const cliente = { res, filtros, ultimaFirma: firmaSnapshot(snapshot) };
    clientesSSE.add(cliente);
    res.write(`retry: 3000\n\nevent: metricas\ndata: ${JSON.stringify(snapshot)}\n\n`);

    const latido = setInterval(() => {
      try {
        res.write(": ping\n\n");
      } catch {
        clearInterval(latido);
        clientesSSE.delete(cliente);
      }
    }, 20_000);

    req.on("close", () => {
      clearInterval(latido);
      clientesSSE.delete(cliente);
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ error: "Ruta no encontrada. Abrí /metrics" }));
});

// ── Arranque en puerto 80 (http://localhost/metrics) con fallback automático ─

function escucharEnPuerto(puerto) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      server.off("listening", onListening);
      reject(err);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve(server.address().port);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(puerto, "127.0.0.1");
  });
}

async function iniciar() {
  const puertoSolicitado = process.env.METRICS_PORT ? Number(process.env.METRICS_PORT) : null;
  const candidatos = puertoSolicitado !== null ? [puertoSolicitado] : [80, 4321, 0];

  let puertoActivo = null;
  let ultimoError = null;

  for (const puerto of candidatos) {
    try {
      puertoActivo = await escucharEnPuerto(puerto);
      break;
    } catch (err) {
      ultimoError = err;
      if (puerto === 80 && (err.code === "EACCES" || err.code === "EADDRINUSE")) {
        console.log(`Puerto 80 no disponible (${err.code}); intentando puerto alternativo...`);
        continue;
      }
      throw err;
    }
  }

  if (puertoActivo === null) {
    console.error("No se pudo iniciar el servidor de métricas:", ultimoError?.message);
    process.exit(1);
  }

  const url = puertoActivo === 80 ? "http://localhost/metrics" : `http://localhost:${puertoActivo}/metrics`;
  console.log(`Dashboard de métricas Antigravity activo en ${url}`);
  console.log(`Leyendo transcripts desde: ${BRAIN_DIR}`);
  console.log(`Proyecto por defecto: ${REPO_NOMBRE}`);
}

const cerrar = () => {
  clearInterval(pollingRespaldo);
  if (watcher) watcher.close();
  for (const c of clientesSSE) c.res.end();
  server.close(() => process.exit(0));
};

process.once("SIGINT", cerrar);
process.once("SIGTERM", cerrar);

iniciar();
