import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PAUSA_MAX_MS = 5 * 60_000;
const HUERFANA_MS = 10 * 60_000;
const TOP = 12;
const MAX_SESIONES = 50;
const MAX_PUNTOS_LINEA = 500;
const MAX_COMANDOS = 25;
const DESCONOCIDO = "desconocido";

const KINDS = [
  ["leer", /^(read|read_file|read_files|view_file|view_file_outline|view_code_item|notebookread|view)$/i],
  ["escribir", /^(write|write_file|write_to_file|edit|edit_file|multiedit|multi_replace_file_content|replace_file_content|replace_in_file|apply_patch|create_file|notebookedit)$/i],
  ["ejecutar", /^(run_command|run_commands|execute_command|bash|powershell|shell|exec_command|manage_task|command_status|send_command_input)$/i],
  ["buscar", /^(search_web|search_marketplace|grep|grep_search|glob|find_by_name|list_dir|list_files|search_codebase|search_files|webfetch|read_url_content)$/i],
  ["skill", /^(skill|skills)$/i],
  ["pregunta", /^(ask_question|askuserquestion|ask_followup_question)$/i],
];

const PATRONES_SECRETOS = [
  [/\bBearer\s+[^\s'"]+/gi, "Bearer [redactado]"],
  [/\bsk-[A-Za-z0-9_-]{6,}/g, "sk-[redactado]"],
  [/\b(gh[pousr]|github_pat)_[A-Za-z0-9_]{6,}/g, "$1_[redactado]"],
  [/\bAKIA[0-9A-Z]{16}\b/g, "AKIA[redactado]"],
  [/(--(?:token|password|secret|api-key)[= ])[^\s'"]+/gi, "$1[redactado]"],
  [/\b([A-Za-z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|PASSWD)[A-Za-z0-9_]*=)[^\s'"]+/gi, "$1[redactado]"],
  [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[email]"],
];

const SUBCOMANDOS = {
  git: new Set(["status", "diff", "log", "add", "commit", "checkout", "switch", "branch", "push", "pull", "fetch", "merge", "rebase", "stash", "show"]),
  npm: new Set(["test", "install", "ci", "run", "start"]),
  npx: new Set(["jest", "stryker", "expo", "vitest", "tsc", "eslint", "tsx", "vite", "prettier"]),
};

const SCRIPTS_NPM = new Set(["test", "mutation", "lint", "typecheck", "build", "dev", "start", "seed"]);

// ── Utilidades de texto y privacidad ────────────────────────────────────────

const normalizarRuta = (ruta) => String(ruta ?? "").replaceAll("\\", "/");
const nombreDe = (ruta) => normalizarRuta(ruta).split("/").filter(Boolean).at(-1) ?? String(ruta ?? "");

export function unwrapArg(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        return unwrapArg(JSON.parse(trimmed));
      } catch {
        return value;
      }
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(unwrapArg);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, unwrapArg(v)]));
  }
  return value;
}

export function rutaPublica(ruta, raiz) {
  const r = normalizarRuta(ruta).trim();
  if (!r) return "(sin ruta)";
  const base = normalizarRuta(raiz).replace(/\/$/, "");
  const esWindows = /^[A-Za-z]:/.test(base);
  const dentro = (esWindows ? r.toLowerCase() : r).startsWith(`${esWindows ? base.toLowerCase() : base}/`);
  if (dentro) return r.slice(base.length + 1);
  if ((esWindows ? r.toLowerCase() : r) === (esWindows ? base.toLowerCase() : base)) return ".";
  const absoluta = r.startsWith("/") || r.startsWith("~") || /^[A-Za-z]:/.test(r);
  if (!absoluta && !r.startsWith("../")) return r.replace(/^\.\//, "");
  return `(fuera del repo)/${nombreDe(r)}`;
}

export function redactar(texto) {
  return PATRONES_SECRETOS.reduce((t, [patron, reemplazo]) => t.replace(patron, reemplazo), String(texto ?? ""));
}

export function binarioDe(comando) {
  const limpio = String(comando ?? "")
    .replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\b/g, "")
    .replace(/'[^']*'|"[^"]*"/g, '""');
  return limpio
    .split(/&&|\|\||;|\||\n/)
    .map((seg) => seg.trim().split(/\s+/).filter((t) => !/^\w+=/.test(t) && !t.startsWith("$")))
    .filter((tokens) => tokens[0] && tokens[0].toLowerCase() !== "cd" && tokens[0].toLowerCase() !== "set-location")
    .map(([primero, segundo, tercero]) => {
      const bin = nombreDe(primero).replace(/\.(exe|cmd|bat|ps1)$/i, "");
      if (!/^[\w.+:-]+$/.test(bin)) return "(otro)";
      const lower = bin.toLowerCase();
      if (!SUBCOMANDOS[lower]?.has(segundo)) return bin;
      if (lower === "npm" && segundo === "run") return SCRIPTS_NPM.has(tercero) ? `npm run ${tercero}` : "npm run";
      return `${lower} ${segundo}`;
    });
}

function primeroDefinido(obj, keys) {
  if (!obj || typeof obj !== "object") return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return undefined;
}

export function clasificarHerramienta(toolName, rawArgs) {
  const args = unwrapArg(rawArgs ?? {});
  const obj = args && typeof args === "object" && !Array.isArray(args) ? args : { value: args };
  const name = String(toolName ?? "desconocida");

  let kind = /^mcp__|^mcp_|^use_mcp_tool$/i.test(name)
    ? "mcp"
    : (KINDS.find(([, re]) => re.test(name))?.[0] ?? "otro");

  let targets = [];
  const skills = [];
  const subagentes = [];

  if (kind === "leer") {
    const p = primeroDefinido(obj, ["Path", "AbsolutePath", "file_path", "path", "filePath"]);
    if (p) {
      targets = Array.isArray(p) ? p.map(String) : [String(p)];
      for (const t of targets) {
        if (/SKILL\.md$/i.test(t)) {
          const partes = normalizarRuta(t).split("/");
          const skillNombre = partes.length >= 2 ? partes.at(-2) : nombreDe(t);
          skills.push(skillNombre);
        }
      }
    }
  } else if (kind === "escribir") {
    const p = primeroDefinido(obj, ["Path", "TargetFile", "file_path", "path", "filePath"]);
    if (p) targets = Array.isArray(p) ? p.map(String) : [String(p)];
  } else if (kind === "ejecutar") {
    const cmd = primeroDefinido(obj, ["CommandLine", "command", "cmd", "Action"]);
    if (cmd) targets = [String(cmd)];
  } else if (kind === "buscar") {
    const q = primeroDefinido(obj, ["query", "queries", "Query", "pattern", "SearchPath", "Url"]);
    if (q) targets = Array.isArray(q) ? q.map(String) : [String(q)];
  } else if (/^invoke_subagent$/i.test(name)) {
    if (Array.isArray(obj.Subagents)) {
      for (const s of obj.Subagents) {
        if (s && typeof s === "object") {
          subagentes.push(String(s.TypeName ?? s.Role ?? "subagent"));
        }
      }
    } else if (obj.TypeName || obj.Role) {
      subagentes.push(String(obj.TypeName ?? obj.Role));
    }
  }

  return { name, kind, targets, skills, subagentes };
}

function parsearDuracionGeneric(content) {
  if (typeof content !== "string") return undefined;
  const inicio = content.match(/^Created At:\s*(.+)$/m)?.[1]?.trim();
  const fin = content.match(/^Completed At:\s*(.+)$/m)?.[1]?.trim();
  if (!inicio || !fin) return undefined;
  const t0 = Date.parse(inicio);
  const t1 = Date.parse(fin);
  if (Number.isNaN(t0) || Number.isNaN(t1) || t1 < t0) return undefined;
  return t1 - t0;
}

// ── Precios y tokens ────────────────────────────────────────────────────────

const normalizarModelo = (id) =>
  String(id ?? "")
    .toLowerCase()
    .replace(/^[^/]+\//, "")
    .replace(/-\d{8}$/, "")
    .replace(/\./g, "-");

export function cargarPrecios(rutaJson) {
  try {
    return JSON.parse(fs.readFileSync(rutaJson, "utf-8"));
  } catch {
    return { moneda: "USD", actualizado: "", modelos: [] };
  }
}

export function calcularCostoUso(uso, precios) {
  if (!precios?.modelos?.length || !uso.modelo) return null;
  const norm = normalizarModelo(uso.modelo);
  const tarifaBase = precios.modelos.find((m) => normalizarModelo(m.id) === norm);
  if (!tarifaBase) return null;

  const promptTotal = (uso.entrada ?? 0) + (uso.cacheLectura ?? 0);
  const tarifa =
    tarifaBase.umbralPrompt && promptTotal > tarifaBase.umbralPrompt && tarifaBase.superior
      ? tarifaBase.superior
      : tarifaBase;

  if (tarifa.entrada === undefined || tarifa.salida === undefined) return null;
  if ((uso.cacheLectura ?? 0) > 0 && tarifa.cacheLectura === undefined) return null;

  const costoEntrada = ((uso.entrada ?? 0) / 1_000_000) * tarifa.entrada;
  const costoSalida = ((uso.salida ?? 0) / 1_000_000) * tarifa.salida;
  const costoCache = ((uso.cacheLectura ?? 0) / 1_000_000) * (tarifa.cacheLectura ?? 0);
  return costoEntrada + costoSalida + costoCache;
}

// ── Lectura de transcripts de Antigravity ───────────────────────────────────

export function directorioBrainPorDefecto(homeDir = os.homedir()) {
  if (process.env.ANTIGRAVITY_BRAIN_DIR) return process.env.ANTIGRAVITY_BRAIN_DIR;
  return path.join(homeDir, ".gemini", "antigravity", "brain");
}

function detectarPerteneceAProyecto(rawText, repoDir, repoNombre) {
  const normRepo = normalizarRuta(repoDir).toLowerCase();
  const textoNorm = normalizarRuta(rawText).toLowerCase();
  if (textoNorm.includes(normRepo)) return true;
  if (repoNombre) {
    const escaped = repoNombre.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`[/\\\\]${escaped}(?:[/\\\\"'\`\\s]|$)`, "i").test(rawText)) return true;
  }
  return false;
}

export function parsearTranscript(convId, filePath, repoDir, repoNombre) {
  let stat;
  let raw;
  try {
    stat = fs.statSync(filePath);
    raw = fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }

  const lines = raw.split("\n").filter(Boolean);
  if (lines.length === 0) return null;

  const steps = [];
  for (const line of lines) {
    try {
      steps.push(JSON.parse(line));
    } catch {
      // Ignora líneas parciales mientras Antigravity está escribiendo
    }
  }
  if (steps.length === 0) return null;

  const perteneceProyecto = detectarPerteneceAProyecto(raw, repoDir, repoNombre);
  const eventos = [];
  const llamadas = [];
  const usosTokens = [];
  const comandos = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const t = Date.parse(step.created_at ?? "");
    if (Number.isNaN(t)) continue;

    if (step.type === "USER_INPUT") {
      eventos.push({ t, tipo: "prompt", sesion: convId });
      continue;
    }

    if (step.type === "PLANNER_RESPONSE") {
      const modelo = step.model || DESCONOCIDO;
      const entrada = Number(step.input_tokens ?? 0);
      const cacheLectura = Number(step.cache_read_tokens ?? 0);
      const salida = Number(step.output_tokens ?? 0);

      if (entrada > 0 || salida > 0 || cacheLectura > 0 || step.model) {
        usosTokens.push({
          t,
          sesion: convId,
          modelo,
          entrada,
          salida,
          cacheLectura,
          cacheEscritura: 0,
        });
      }

      const toolCalls = Array.isArray(step.tool_calls) ? step.tool_calls : [];
      if (toolCalls.length === 0) {
        eventos.push({ t, tipo: "fin", sesion: convId, modelo });
      } else {
        // Los resultados MODEL:GENERIC aparecen inmediatamente después en el mismo orden
        let cursor = i + 1;
        for (const tc of toolCalls) {
          let resultStep = null;
          while (cursor < steps.length) {
            const candidate = steps[cursor];
            if (candidate.type === "PLANNER_RESPONSE" || candidate.type === "USER_INPUT") break;
            cursor++;
            if (candidate.type === "GENERIC") {
              resultStep = candidate;
              break;
            }
          }

          const clasif = clasificarHerramienta(tc.name, tc.args);
          const status = resultStep?.status ?? (step.status === "RUNNING" ? "RUNNING" : "DONE");
          const falla = status === "ERROR" || status === "INVALID";
          const enCurso = status === "RUNNING";
          const durationMs = resultStep ? parsearDuracionGeneric(resultStep.content) : undefined;
          const outputChars =
            resultStep && typeof resultStep.content === "string" && clasif.kind !== "escribir"
              ? resultStep.content.length
              : 0;

          const callRecord = {
            t,
            sesion: convId,
            modelo,
            tool: clasif.name,
            kind: clasif.kind,
            targets: clasif.targets,
            skills: clasif.skills,
            subagentes: clasif.subagentes,
            durationMs,
            outputChars,
            falla,
            enCurso,
          };
          llamadas.push(callRecord);
          eventos.push({
            t,
            tipo: "herramienta",
            sesion: convId,
            modelo,
            kind: clasif.kind,
            falla,
          });

          if (clasif.kind === "ejecutar" && clasif.targets[0]) {
            comandos.push({
              ts: new Date(t).toISOString(),
              sesion: convId.slice(0, 8),
              modelo,
              comando: clasif.targets[0],
            });
          }
        }
      }
    }
  }

  if (eventos.length === 0 && usosTokens.length === 0) return null;

  const timestamps = [...eventos.map((e) => e.t), ...usosTokens.map((u) => u.t)].sort((a, b) => a - b);
  const inicioMs = timestamps[0];
  const finMs = timestamps.at(-1);

  return {
    id: convId,
    idCorto: convId.slice(0, 8),
    mtimeMs: stat.mtimeMs,
    perteneceProyecto,
    inicioMs,
    finMs,
    eventos,
    llamadas,
    usosTokens,
    comandos,
  };
}

// ── Agregación de métricas ──────────────────────────────────────────────────

function percentil(valores, p) {
  if (valores.length === 0) return 0;
  const orden = [...valores].sort((a, b) => a - b);
  return orden[Math.max(0, Math.ceil((p / 100) * orden.length) - 1)];
}

function contar(items, claveFn) {
  const mapa = new Map();
  for (const item of items) {
    const k = claveFn(item);
    if (!k) continue;
    mapa.set(k, (mapa.get(k) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .map(([nombre, n]) => ({ nombre, n }))
    .sort((a, b) => b.n - a.n || a.nombre.localeCompare(b.nombre));
}

function pasoPara(desde, hasta) {
  const rangoMin = (hasta - desde) / 60_000;
  return rangoMin <= 180 ? 1 : rangoMin <= 24 * 60 ? 10 : 60;
}

export function calcularMetricas(sesionesRaw, filtros, opciones) {
  const ahora = opciones.ahora ?? Date.now();
  const raiz = opciones.repoDir;
  const precios = opciones.precios;

  const alcance = filtros.alcance === "todos" ? "todos" : "proyecto";
  const sesionesPorAlcance = sesionesRaw.filter((s) => (alcance === "todos" ? true : s.perteneceProyecto));

  // Lista completa de sesiones y modelos disponibles para poblar los selectores
  const modelosDisponibles = [
    ...new Set(
      sesionesPorAlcance.flatMap((s) => s.usosTokens.map((u) => u.modelo)).filter((m) => m && m !== DESCONOCIDO)
    ),
  ].sort();

  const ventanaMs = filtros.ventanaMin ? filtros.ventanaMin * 60_000 : null;
  const corte = ventanaMs ? ahora - ventanaMs : null;

  const sesionesFiltradas = sesionesPorAlcance
    .filter((s) => (!filtros.sesion ? true : s.idCorto === filtros.sesion || s.id === filtros.sesion))
    .map((s) => {
      const eventos = s.eventos.filter(
        (e) => (corte === null || e.t >= corte) && (!filtros.modelo || !e.modelo || e.modelo === filtros.modelo)
      );
      const llamadas = s.llamadas.filter(
        (c) => (corte === null || c.t >= corte) && (!filtros.modelo || c.modelo === filtros.modelo)
      );
      const usosTokens = s.usosTokens.filter(
        (u) => (corte === null || u.t >= corte) && (!filtros.modelo || u.modelo === filtros.modelo)
      );
      const comandos = s.comandos.filter(
        (c) => (corte === null || Date.parse(c.ts) >= corte) && (!filtros.modelo || c.modelo === filtros.modelo)
      );
      return { ...s, eventos, llamadas, usosTokens, comandos };
    })
    .filter((s) => s.eventos.length > 0 || s.llamadas.length > 0 || s.usosTokens.length > 0)
    .sort((a, b) => b.finMs - a.finMs);

  const resumenesSesiones = [];
  const todosEventos = [];
  const todasLlamadas = [];
  const todosUsos = [];
  const todosComandos = [];
  const cambiosDeModelo = [];
  const enCurso = [];

  for (const s of sesionesFiltradas.slice(0, MAX_SESIONES)) {
    const evsOrdenados = [...s.eventos].sort((a, b) => a.t - b.t);
    const tInicio = evsOrdenados[0]?.t ?? s.inicioMs;
    const tFin = evsOrdenados.at(-1)?.t ?? s.finMs;

    let activoMs = 0;
    for (let i = 1; i < evsOrdenados.length; i++) {
      const salto = evsOrdenados[i].t - evsOrdenados[i - 1].t;
      if (salto <= PAUSA_MAX_MS) activoMs += salto;
    }

    const prompts = evsOrdenados.filter((e) => e.tipo === "prompt").length;
    const fallas = s.llamadas.filter((c) => c.falla).length;
    const corriendo = s.llamadas.filter((c) => c.enCurso && ahora - c.t <= HUERFANA_MS);
    for (const c of corriendo) {
      enCurso.push({
        sesion: s.idCorto,
        herramienta: c.tool,
        desdeMs: Math.max(0, ahora - c.t),
      });
    }

    // Modelos y cambios de modelo en la sesión
    const modelosOrden = [];
    const usosOrdenados = [...s.usosTokens].sort((a, b) => a.t - b.t);
    for (const u of usosOrdenados) {
      if (u.modelo && u.modelo !== DESCONOCIDO) {
        if (modelosOrden.length > 0 && modelosOrden.at(-1) !== u.modelo) {
          cambiosDeModelo.push({
            t: new Date(u.t).toISOString(),
            sesion: s.idCorto,
            de: modelosOrden.at(-1),
            a: u.modelo,
          });
        }
        modelosOrden.push(u.modelo);
      }
    }
    const modelosUnicos = [...new Set(modelosOrden)];

    // Tokens y costo de la sesión
    let tokensSesion = null;
    let costoUsd = null;
    let costoParcial = false;
    const sinPrecioSesion = new Set();

    if (usosOrdenados.length > 0) {
      tokensSesion = { entrada: 0, salida: 0, cacheLectura: 0, cacheEscritura: 0 };
      for (const u of usosOrdenados) {
        tokensSesion.entrada += u.entrada;
        tokensSesion.salida += u.salida;
        tokensSesion.cacheLectura += u.cacheLectura;
        tokensSesion.cacheEscritura += u.cacheEscritura;
        const c = calcularCostoUso(u, precios);
        if (c === null) sinPrecioSesion.add(u.modelo);
        else costoUsd = (costoUsd ?? 0) + c;
      }
      costoParcial = costoUsd !== null && sinPrecioSesion.size > 0;
    }

    resumenesSesiones.push({
      id: s.idCorto,
      idCompleto: s.id,
      perteneceProyecto: s.perteneceProyecto,
      inicio: new Date(tInicio).toISOString(),
      duracionMs: Math.max(0, tFin - tInicio),
      activoMs,
      prompts,
      turnos: prompts || (s.llamadas.length > 0 ? 1 : 0),
      herramientas: s.llamadas.length,
      fallas,
      enCurso: corriendo.length > 0,
      modelos: modelosUnicos,
      tokens: tokensSesion,
      costoUsd,
      costoParcial,
    });

    todosEventos.push(...evsOrdenados);
    todasLlamadas.push(...s.llamadas);
    todosUsos.push(...usosOrdenados);
    todosComandos.push(...s.comandos);
  }

  // KPIs globales
  const totalHerramientas = todasLlamadas.length;
  const totalFallas = todasLlamadas.filter((c) => c.falla).length;
  const totalPrompts = todosEventos.filter((e) => e.tipo === "prompt").length;
  const tiempoActivoMs = resumenesSesiones.reduce((acc, s) => acc + s.activoMs, 0);
  const caracteresDevueltos = todasLlamadas.reduce((acc, c) => acc + (c.outputChars ?? 0), 0);

  // Actividad por tramo de tiempo
  todosEventos.sort((a, b) => a.t - b.t);
  let porTiempo = { pasoMin: 1, puntos: [] };
  if (todosEventos.length > 0) {
    const pasoMin = pasoPara(todosEventos[0].t, todosEventos.at(-1).t);
    const paso = pasoMin * 60_000;
    const tramos = new Map();
    for (const e of todosEventos) {
      const tramo = Math.floor(e.t / paso) * paso;
      tramos.set(tramo, (tramos.get(tramo) ?? 0) + 1);
    }
    porTiempo = {
      pasoMin,
      puntos: [...tramos.entries()].map(([t, eventos]) => ({ t: new Date(t).toISOString(), eventos })),
    };
  }

  // Tokens globales, por tiempo y por modelo
  todosUsos.sort((a, b) => a.t - b.t);
  const totalTokensObj =
    todosUsos.length > 0
      ? todosUsos.reduce(
          (acc, u) => ({
            entrada: acc.entrada + u.entrada,
            salida: acc.salida + u.salida,
            cacheLectura: acc.cacheLectura + u.cacheLectura,
            cacheEscritura: acc.cacheEscritura + u.cacheEscritura,
          }),
          { entrada: 0, salida: 0, cacheLectura: 0, cacheEscritura: 0 }
        )
      : null;

  let tokensPorTiempo = { pasoMin: 1, puntos: [] };
  if (todosUsos.length > 0) {
    const pasoMin = pasoPara(todosUsos[0].t, todosUsos.at(-1).t);
    const paso = pasoMin * 60_000;
    const tramos = new Map();
    for (const u of todosUsos) {
      const tramo = Math.floor(u.t / paso) * paso;
      const cur = tramos.get(tramo) ?? { entrada: 0, salida: 0, cacheLectura: 0, cacheEscritura: 0 };
      cur.entrada += u.entrada;
      cur.salida += u.salida;
      cur.cacheLectura += u.cacheLectura;
      cur.cacheEscritura += u.cacheEscritura;
      tramos.set(tramo, cur);
    }
    tokensPorTiempo = {
      pasoMin,
      puntos: [...tramos.entries()].map(([t, porTipo]) => ({ t: new Date(t).toISOString(), porTipo })),
    };
  }

  let costoGlobalUsd = null;
  const sinPrecioGlobal = new Set();
  const porModeloMap = new Map();

  for (const u of todosUsos) {
    const c = calcularCostoUso(u, precios);
    if (c === null) sinPrecioGlobal.add(u.modelo);
    else costoGlobalUsd = (costoGlobalUsd ?? 0) + c;

    const fila = porModeloMap.get(u.modelo) ?? {
      modelo: u.modelo,
      solicitudes: 0,
      entrada: 0,
      salida: 0,
      cacheLectura: 0,
      cacheEscritura: 0,
      costoUsd: null,
      sinPrecio: false,
    };
    fila.solicitudes += 1;
    fila.entrada += u.entrada;
    fila.salida += u.salida;
    fila.cacheLectura += u.cacheLectura;
    fila.cacheEscritura += u.cacheEscritura;
    if (c === null) fila.sinPrecio = true;
    else fila.costoUsd = (fila.costoUsd ?? 0) + c;
    porModeloMap.set(u.modelo, fila);
  }

  const porModelo = [...porModeloMap.values()]
    .map(({ sinPrecio, ...rest }) => ({ ...rest, costoParcial: rest.costoUsd !== null && sinPrecio }))
    .sort(
      (a, b) =>
        b.entrada + b.salida + b.cacheLectura - (a.entrada + a.salida + a.cacheLectura)
    );

  // Acciones por tipo, herramientas más usadas, fallas, duraciones
  const acciones = contar(todasLlamadas, (c) => c.kind).map(({ nombre, n }) => ({ kind: nombre, n }));

  const kindPorTool = new Map();
  for (const c of todasLlamadas) {
    if (!kindPorTool.has(c.tool)) kindPorTool.set(c.tool, c.kind);
  }
  const herramientas = contar(todasLlamadas, (c) => c.tool)
    .slice(0, TOP)
    .map(({ nombre, n }) => ({ nombre, kind: kindPorTool.get(nombre) ?? "otro", n }));

  const fallasPorHerramienta = contar(
    todasLlamadas.filter((c) => c.falla),
    (c) => c.tool
  ).slice(0, TOP);

  const durPorKind = new Map();
  for (const c of todasLlamadas) {
    if (c.durationMs === undefined) continue;
    if (!durPorKind.has(c.kind)) durPorKind.set(c.kind, []);
    durPorKind.get(c.kind).push(c.durationMs);
  }
  const duraciones = [...durPorKind.entries()]
    .map(([kind, vals]) => ({
      kind,
      n: vals.length,
      p50Ms: percentil(vals, 50),
      p95Ms: percentil(vals, 95),
    }))
    .sort((a, b) => b.p95Ms - a.p95Ms);

  // Archivos, binarios, skills, subagentes, mcp
  const archivosLeidos = contar(
    todasLlamadas.filter((c) => c.kind === "leer").flatMap((c) => c.targets),
    (r) => rutaPublica(r, raiz)
  ).slice(0, TOP);

  const archivosEscritos = contar(
    todasLlamadas.filter((c) => c.kind === "escribir").flatMap((c) => c.targets),
    (r) => rutaPublica(r, raiz)
  ).slice(0, TOP);

  const binarios = contar(
    todasLlamadas.filter((c) => c.kind === "ejecutar").flatMap((c) => c.targets.flatMap(binarioDe)),
    (b) => b
  ).slice(0, TOP);

  const skills = contar(
    todasLlamadas.flatMap((c) => c.skills),
    (s) => s
  ).slice(0, TOP);

  const subagentes = contar(
    todasLlamadas.flatMap((c) => c.subagentes),
    (s) => s
  ).slice(0, TOP);

  const mcp = contar(
    todasLlamadas.filter((c) => c.kind === "mcp"),
    (c) => c.tool
  ).slice(0, TOP);

  // Línea de tiempo de la sesión seleccionada (o la más reciente)
  let lineaDeTiempo = null;
  const sesionLinea = sesionesFiltradas[0];
  if (sesionLinea && sesionLinea.eventos.length > 0) {
    const evs = [...sesionLinea.eventos].sort((a, b) => a.t - b.t);
    const t0 = evs[0].t;
    const tLast = evs.at(-1).t;
    lineaDeTiempo = {
      sesion: sesionLinea.idCorto,
      duracionMs: Math.max(1000, tLast - t0),
      puntos: evs.slice(0, MAX_PUNTOS_LINEA).map((e) => ({
        t: e.t - t0,
        tipo: e.tipo,
        kind: e.kind,
        falla: e.falla || undefined,
      })),
    };
  }

  // Comandos recientes (solo si modo detalle está encendido, redactando secretos)
  const comandosRecientes = filtros.detalle
    ? todosComandos
        .sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts))
        .slice(0, MAX_COMANDOS)
        .map((c) => ({ ...c, comando: redactar(c.comando) }))
    : null;

  return {
    generado: new Date(ahora).toISOString(),
    alcance,
    proyecto: opciones.repoNombre,
    vacio: resumenesSesiones.length === 0,
    totalSesionesDisponibles: {
      proyecto: sesionesRaw.filter((s) => s.perteneceProyecto).length,
      todos: sesionesRaw.length,
    },
    modelosDisponibles,
    sesionesSelector: sesionesPorAlcance
      .sort((a, b) => b.finMs - a.finMs)
      .slice(0, MAX_SESIONES)
      .map((s) => ({ id: s.idCorto, inicio: new Date(s.inicioMs).toISOString(), proyecto: s.perteneceProyecto })),
    kpis: {
      sesiones: resumenesSesiones.length,
      prompts: totalPrompts,
      herramientas: totalHerramientas,
      fallas: totalFallas,
      tasaFallas: totalHerramientas > 0 ? totalFallas / totalHerramientas : 0,
      tiempoActivoMs,
      caracteresDevueltos,
    },
    enCurso,
    porTiempo,
    tokens: {
      disponible: totalTokensObj !== null,
      total: totalTokensObj,
      porTiempo: tokensPorTiempo,
      porModelo,
      cambiosDeModelo,
      costo: {
        usd: costoGlobalUsd,
        parcial: costoGlobalUsd !== null && sinPrecioGlobal.size > 0,
        sinPrecio: [...sinPrecioGlobal],
      },
    },
    acciones,
    herramientas,
    fallasPorHerramienta,
    duraciones,
    archivosLeidos,
    archivosEscritos,
    binarios,
    skills,
    subagentes,
    mcp,
    lineaDeTiempo,
    sesiones: resumenesSesiones,
    comandosRecientes,
  };
}

export function crearLectorAntigravity({ brainDir, repoDir, repoNombre, preciosPath }) {
  const cache = new Map(); // convId -> { mtimeMs, size, parsed }

  function leerSesiones() {
    if (!fs.existsSync(brainDir)) return [];
    let entries;
    try {
      entries = fs.readdirSync(brainDir, { withFileTypes: true });
    } catch {
      return [];
    }

    const presentes = new Set();
    const resultado = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const convId = entry.name;
      const transcriptPath = path.join(brainDir, convId, ".system_generated", "logs", "transcript.jsonl");
      if (!fs.existsSync(transcriptPath)) continue;

      presentes.add(convId);
      let stat;
      try {
        stat = fs.statSync(transcriptPath);
      } catch {
        continue;
      }

      const prev = cache.get(convId);
      if (prev && prev.mtimeMs === stat.mtimeMs && prev.size === stat.size) {
        if (prev.parsed) resultado.push(prev.parsed);
        continue;
      }

      const parsed = parsearTranscript(convId, transcriptPath, repoDir, repoNombre);
      cache.set(convId, { mtimeMs: stat.mtimeMs, size: stat.size, parsed });
      if (parsed) resultado.push(parsed);
    }

    for (const key of cache.keys()) {
      if (!presentes.has(key)) cache.delete(key);
    }

    return resultado;
  }

  function obtenerSnapshot(filtros = {}) {
    const sesiones = leerSesiones();
    const precios = cargarPrecios(preciosPath);
    return calcularMetricas(sesiones, filtros, { repoDir, repoNombre, precios });
  }

  return { obtenerSnapshot, leerSesiones };
}
