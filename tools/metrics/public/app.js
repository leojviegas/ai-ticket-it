const KIND_COLORS = {
  leer: "var(--kind-leer)",
  escribir: "var(--kind-escribir)",
  ejecutar: "var(--kind-ejecutar)",
  buscar: "var(--kind-buscar)",
  skill: "var(--kind-skill)",
  mcp: "var(--kind-mcp)",
  pregunta: "var(--kind-pregunta)",
  otro: "var(--kind-otro)",
};

const TOKEN_SERIES = [
  { id: "entrada", nombre: "Entrada", color: "var(--tokens-entrada)" },
  { id: "salida", nombre: "Salida", color: "var(--tokens-salida)" },
  { id: "cacheLectura", nombre: "Caché (lectura)", color: "var(--tokens-cache-lectura)" },
  { id: "cacheEscritura", nombre: "Caché (escritura)", color: "var(--tokens-cache-escritura)" },
];

const colorKind = (k) => KIND_COLORS[k] ?? KIND_COLORS.otro;

// ── Formateadores ───────────────────────────────────────────────────────────

const numFmt = new Intl.NumberFormat("es-AR");
const fmtNum = (n) => (n === null || n === undefined ? "n/d" : numFmt.format(Math.round(n)));
const fmtPct = (r) => (r === null || r === undefined ? "n/d" : `${(r * 100).toFixed(r > 0 && r < 0.01 ? 2 : 1)} %`);
const fmtUsd = (v) => (v === null || v === undefined ? "n/d" : `$${v < 0.01 ? v.toFixed(4) : v.toFixed(2)}`);

function fmtCompacto(n) {
  if (n === null || n === undefined) return "n/d";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} k`;
  return String(Math.round(n));
}

function fmtDuracion(ms) {
  if (ms === null || ms === undefined) return "n/d";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s < 10 ? s.toFixed(1) : Math.round(s)} s`;
  const m = Math.floor(s / 60);
  const remS = Math.round(s % 60);
  if (m < 60) return remS > 0 ? `${m} m ${remS} s` : `${m} m`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return `${h} h ${remM} m`;
}

function fmtHora(iso) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

function fmtHoraExacta(iso) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
}

function fmtFechaHora(iso) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

function nombrePaso(min) {
  return min === 1 ? "minuto" : min === 60 ? "hora" : `${min} minutos`;
}

function recortar(texto, max = 46) {
  const s = String(texto ?? "").replace(/^mcp__(.+?)__(.+)$/, "$1 · $2");
  if (s.length <= max) return s;
  return s.includes("/") ? `…${s.slice(-(max - 1))}` : `${s.slice(0, max - 1)}…`;
}

function esc(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// ── Estado y URL ────────────────────────────────────────────────────────────

const vistaTabla = new Set();
let estadoConexion = "reconectando";
let ultimoSnapshot = null;
let eventSource = null;
let pollingTimer = null;
let fallosSSE = 0;

function leerFiltrosUrl() {
  const sp = new URLSearchParams(window.location.search);
  return {
    alcance: sp.get("alcance") === "todos" ? "todos" : "proyecto",
    modelo: sp.get("modelo") ?? "",
    ventana: sp.get("ventana") ?? "",
    sesion: sp.get("sesion") ?? "",
    detalle: sp.get("detalle") === "1",
  };
}

function actualizarFiltro(clave, valor) {
  const sp = new URLSearchParams(window.location.search);
  if (valor && !(clave === "alcance" && valor === "proyecto")) sp.set(clave, valor);
  else sp.delete(clave);
  if (clave === "alcance") sp.delete("sesion");
  const qs = sp.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  conectar();
}

function construirQuery() {
  const f = leerFiltrosUrl();
  const sp = new URLSearchParams();
  sp.set("alcance", f.alcance);
  if (f.modelo) sp.set("modelo", f.modelo);
  if (f.ventana) sp.set("ventana", f.ventana);
  if (f.sesion) sp.set("sesion", f.sesion);
  if (f.detalle) sp.set("detalle", "1");
  return sp.toString();
}

// ── Generadores SVG puros ───────────────────────────────────────────────────

function svgBarrasHorizontales(filas, eje, formato = fmtNum) {
  if (!filas.length) return `<p class="grafico-vacio">Sin datos</p>`;
  const maxVal = Math.max(1, ...filas.map((f) => f.valor));
  const rowH = 38;
  const padTop = 6;
  const padBottom = 26;
  const width = 560;
  const barMaxW = 360;
  const left = 6;
  const height = padTop + filas.length * rowH + padBottom;

  const barras = filas
    .map((f, i) => {
      const y = padTop + i * rowH;
      const w = Math.max(3, (f.valor / maxVal) * barMaxW);
      const textoVal = f.texto ?? formato(f.valor);
      return `
        <g>
          <text x="${left}" y="${y + 12}" fill="var(--texto)" font-size="12">
            <title>${esc(f.etiqueta)}</title>${esc(recortar(f.etiqueta, 54))}
          </text>
          <rect x="${left}" y="${y + 17}" width="${w.toFixed(1)}" height="13" rx="3" fill="${f.color ?? "var(--agente-antigravity)"}">
            <title>${esc(f.etiqueta)}: ${esc(textoVal)}</title>
          </rect>
          <text x="${(left + w + 8).toFixed(1)}" y="${y + 28}" fill="var(--texto)" font-size="12" font-weight="600">${esc(textoVal)}</text>
        </g>`;
    })
    .join("");

  return `
    <svg class="grafico-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(eje)}">
      ${barras}
      <text x="${left}" y="${height - 6}" fill="var(--texto-suave)" font-size="11" font-weight="600">${esc(eje)}</text>
    </svg>`;
}

function svgTorta(segmentosRaw, unidad, formato = fmtNum) {
  const ordenados = [...segmentosRaw].filter((s) => s.valor > 0).sort((a, b) => b.valor - a.valor);
  if (!ordenados.length) return `<p class="grafico-vacio">Sin datos</p>`;

  const segmentos =
    ordenados.length > 6
      ? [
          ...ordenados.slice(0, 5),
          {
            nombre: "otros",
            valor: ordenados.slice(5).reduce((a, b) => a + b.valor, 0),
            color: "var(--kind-otro)",
          },
        ]
      : ordenados;

  const total = segmentos.reduce((a, b) => a + b.valor, 0);
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 68;
  const strokeW = 28;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  const arcos = segmentos
    .map((s) => {
      const frac = s.valor / total;
      const len = frac * circ;
      const dash = `${Math.max(0, len - 1.5).toFixed(2)} ${(circ - len + 1.5).toFixed(2)}`;
      const segHtml = `
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${strokeW}"
          stroke-dasharray="${dash}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})">
          <title>${esc(s.nombre)}: ${esc(formato(s.valor))} (${Math.round(frac * 100)} %)</title>
        </circle>`;
      offset += len;
      return segHtml;
    })
    .join("");

  const leyenda = segmentos
    .map((s) => {
      const pct = Math.round((s.valor / total) * 100);
      return `<li><span class="leyenda-color" style="background:${s.color}"></span>${esc(s.nombre)} · ${pct} %</li>`;
    })
    .join("");

  return `
    <div class="torta-fila">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Distribución de ${esc(unidad)}">
        ${arcos}
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="var(--texto)" font-size="18" font-weight="800">${esc(formato(total))}</text>
        <text x="${cx}" y="${cy + 14}" text-anchor="middle" fill="var(--texto-suave)" font-size="11">${esc(unidad)}</text>
      </svg>
      <ul class="leyenda">${leyenda}</ul>
    </div>`;
}

function svgSerieLinea(puntos, ejeY, formato = fmtNum) {
  if (!puntos.length) return `<p class="grafico-vacio">Sin datos</p>`;
  const width = 920;
  const height = 220;
  const pad = { top: 14, right: 20, bottom: 34, left: 56 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const vals = puntos.map((p) => p.eventos);
  const maxY = Math.max(1, ...vals);
  const ts = puntos.map((p) => Date.parse(p.t));
  const minT = ts[0];
  const maxT = ts.at(-1);
  const spanT = Math.max(1, maxT - minT);
  const variosDias = spanT > 20 * 3_600_000;

  const xOf = (t, idx) =>
    puntos.length === 1 ? pad.left + plotW / 2 : pad.left + ((t - minT) / spanT) * plotW;
  const yOf = (v) => pad.top + plotH - (v / maxY) * plotH;

  let dPath = "";
  puntos.forEach((p, i) => {
    const x = xOf(ts[i], i);
    const y = yOf(p.eventos);
    if (i === 0) dPath = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
    else dPath += ` H ${x.toFixed(1)} V ${y.toFixed(1)}`;
  });

  const gridY = [0, 0.25, 0.5, 0.75, 1]
    .map((f) => {
      const y = pad.top + plotH - f * plotH;
      const v = Math.round(f * maxY);
      return `
        <line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${width - pad.right}" y2="${y.toFixed(1)}" stroke="var(--linea-suave)" stroke-dasharray="3 3" />
        <text x="${pad.left - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" fill="var(--texto-suave)" font-size="11">${esc(formato(v))}</text>`;
    })
    .join("");

  const tickCount = Math.min(6, Math.max(2, puntos.length));
  const ticksX = Array.from({ length: tickCount }, (_, i) => {
    const frac = tickCount === 1 ? 0 : i / (tickCount - 1);
    const t = minT + frac * spanT;
    const x = pad.left + frac * plotW;
    const label = variosDias ? fmtFechaHora(new Date(t).toISOString()) : fmtHora(new Date(t).toISOString());
    return `<text x="${x.toFixed(1)}" y="${height - 10}" text-anchor="middle" fill="var(--texto-suave)" font-size="11">${esc(label)}</text>`;
  }).join("");

  const circulos = puntos
    .map((p, i) => {
      const x = xOf(ts[i], i);
      const y = yOf(p.eventos);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="var(--agente-antigravity)"><title>${esc(fmtFechaHora(p.t))}: ${p.eventos} eventos</title></circle>`;
    })
    .join("");

  return `
    <svg class="grafico-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(ejeY)}">
      ${gridY}
      <path d="${dPath}" fill="none" stroke="var(--agente-antigravity)" stroke-width="2.5" />
      ${circulos}
      ${ticksX}
    </svg>`;
}

function svgBarrasApiladasTokens(puntos) {
  if (!puntos.length) return `<p class="grafico-vacio">Sin datos</p>`;
  const width = 920;
  const height = 225;
  const pad = { top: 14, right: 20, bottom: 34, left: 62 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const totales = puntos.map(
    (p) => p.porTipo.entrada + p.porTipo.salida + p.porTipo.cacheLectura + p.porTipo.cacheEscritura
  );
  const maxY = Math.max(1, ...totales);
  const barW = Math.max(6, Math.min(34, plotW / Math.max(puntos.length, 1) - 4));
  const stepX = plotW / Math.max(puntos.length, 1);

  const gridY = [0, 0.25, 0.5, 0.75, 1]
    .map((f) => {
      const y = pad.top + plotH - f * plotH;
      const v = Math.round(f * maxY);
      return `
        <line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${width - pad.right}" y2="${y.toFixed(1)}" stroke="var(--linea-suave)" stroke-dasharray="3 3" />
        <text x="${pad.left - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" fill="var(--texto-suave)" font-size="11">${esc(fmtCompacto(v))}</text>`;
    })
    .join("");

  const barras = puntos
    .map((p, idx) => {
      const x = pad.left + idx * stepX + (stepX - barW) / 2;
      let yCursor = pad.top + plotH;
      const rects = TOKEN_SERIES.map((s) => {
        const val = p.porTipo[s.id] ?? 0;
        if (val <= 0) return "";
        const h = Math.max(1.5, (val / maxY) * plotH);
        yCursor -= h;
        return `<rect x="${x.toFixed(1)}" y="${yCursor.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="${s.color}">
          <title>${esc(fmtFechaHora(p.t))} · ${esc(s.nombre)}: ${esc(fmtNum(val))}</title>
        </rect>`;
      }).join("");
      return rects;
    })
    .join("");

  const labelStep = Math.max(1, Math.ceil(puntos.length / 6));
  const ticksX = puntos
    .map((p, idx) => {
      if (idx % labelStep !== 0 && idx !== puntos.length - 1) return "";
      const x = pad.left + idx * stepX + stepX / 2;
      return `<text x="${x.toFixed(1)}" y="${height - 10}" text-anchor="middle" fill="var(--texto-suave)" font-size="11">${esc(fmtHora(p.t))}</text>`;
    })
    .join("");

  const leyenda = TOKEN_SERIES.map(
    (s) => `<li><span class="leyenda-color" style="background:${s.color}"></span>${esc(s.nombre)}</li>`
  ).join("");

  return `
    <svg class="grafico-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Tokens por tiempo">
      ${gridY}
      ${barras}
      ${ticksX}
    </svg>
    <ul class="leyenda">${leyenda}</ul>`;
}

function svgDuraciones(filas) {
  if (!filas.length) return `<p class="grafico-vacio">Sin datos</p>`;
  const width = 560;
  const height = 220;
  const pad = { top: 14, right: 16, bottom: 44, left: 64 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const maxMs = Math.max(1, ...filas.map((f) => f.p95Ms));
  const groupW = plotW / filas.length;
  const barW = Math.max(10, Math.min(24, groupW * 0.34));

  const gridY = [0, 0.5, 1]
    .map((f) => {
      const y = pad.top + plotH - f * plotH;
      return `
        <line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${width - pad.right}" y2="${y.toFixed(1)}" stroke="var(--linea-suave)" stroke-dasharray="3 3" />
        <text x="${pad.left - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" fill="var(--texto-suave)" font-size="11">${esc(fmtDuracion(f * maxMs))}</text>`;
    })
    .join("");

  const grupos = filas
    .map((f, i) => {
      const cx = pad.left + i * groupW + groupW / 2;
      const h50 = Math.max(2, (f.p50Ms / maxMs) * plotH);
      const h95 = Math.max(2, (f.p95Ms / maxMs) * plotH);
      return `
        <rect x="${(cx - barW - 2).toFixed(1)}" y="${(pad.top + plotH - h50).toFixed(1)}" width="${barW.toFixed(1)}" height="${h50.toFixed(1)}" rx="3" fill="var(--kind-leer)">
          <title>${esc(f.kind)} · p50: ${esc(fmtDuracion(f.p50Ms))}</title>
        </rect>
        <rect x="${(cx + 2).toFixed(1)}" y="${(pad.top + plotH - h95).toFixed(1)}" width="${barW.toFixed(1)}" height="${h95.toFixed(1)}" rx="3" fill="var(--kind-escribir)">
          <title>${esc(f.kind)} · p95: ${esc(fmtDuracion(f.p95Ms))}</title>
        </rect>
        <text x="${cx.toFixed(1)}" y="${height - 16}" text-anchor="middle" fill="var(--texto-suave)" font-size="11">${esc(f.kind)}</text>`;
    })
    .join("");

  return `
    <svg class="grafico-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Duración por tipo">
      ${gridY}
      ${grupos}
    </svg>
    <ul class="leyenda">
      <li><span class="leyenda-color" style="background:var(--kind-leer)"></span>Mediana (p50)</li>
      <li><span class="leyenda-color" style="background:var(--kind-escribir)"></span>Peor caso habitual (p95)</li>
    </ul>`;
}

function svgLineaDeTiempo(datos) {
  if (!datos || !datos.puntos.length) return `<p class="grafico-vacio">Sin datos</p>`;
  const herramientas = datos.puntos.filter((p) => p.tipo === "herramienta");
  const carriles = [...new Set(herramientas.map((p) => p.kind ?? "otro"))];
  if (!carriles.length) return `<p class="grafico-vacio">Sin llamadas a herramientas en esta sesión</p>`;

  const width = 920;
  const rowH = 34;
  const pad = { top: 18, right: 20, bottom: 34, left: 78 };
  const plotW = width - pad.left - pad.right;
  const plotH = carriles.length * rowH;
  const height = pad.top + plotH + pad.bottom;
  const finMs = Math.max(1000, datos.duracionMs);

  const xOf = (t) => pad.left + (t / finMs) * plotW;
  const yOf = (kind) => pad.top + carriles.indexOf(kind) * rowH + rowH / 2;

  const grillaCarriles = carriles
    .map((c, idx) => {
      const y = pad.top + idx * rowH + rowH / 2;
      return `
        <line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="var(--linea-suave)" stroke-dasharray="3 3" />
        <text x="${pad.left - 10}" y="${y + 4}" text-anchor="end" fill="var(--texto-suave)" font-size="11">${esc(c)}</text>`;
    })
    .join("");

  const marcas = datos.puntos
    .filter((p) => p.tipo !== "herramienta")
    .map((p) => {
      const x = xOf(p.t);
      const dash = p.tipo === "prompt" ? 'stroke-dasharray="5 4"' : "";
      return `<line x1="${x.toFixed(1)}" y1="${pad.top}" x2="${x.toFixed(1)}" y2="${pad.top + plotH}" stroke="var(--texto)" stroke-width="1.4" ${dash}>
        <title>${p.tipo === "prompt" ? "Prompt" : "Fin de turno"} (+${esc(fmtDuracion(p.t))})</title>
      </line>`;
    })
    .join("");

  const puntosSvg = herramientas
    .map((p) => {
      const x = xOf(p.t);
      const y = yOf(p.kind ?? "otro");
      if (p.falla) {
        return `<g stroke="var(--error)" stroke-width="2.5">
          <line x1="${(x - 4).toFixed(1)}" y1="${(y - 4).toFixed(1)}" x2="${(x + 4).toFixed(1)}" y2="${(y + 4).toFixed(1)}" />
          <line x1="${(x + 4).toFixed(1)}" y1="${(y - 4).toFixed(1)}" x2="${(x - 4).toFixed(1)}" y2="${(y + 4).toFixed(1)}" />
          <title>Falla · ${esc(p.kind)} (+${esc(fmtDuracion(p.t))})</title>
        </g>`;
      }
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${colorKind(p.kind ?? "otro")}" stroke="var(--superficie)" stroke-width="1">
        <title>${esc(p.kind)} (+${esc(fmtDuracion(p.t))})</title>
      </circle>`;
    })
    .join("");

  const ticksX = Array.from({ length: 6 }, (_, i) => {
    const t = (finMs * i) / 5;
    const x = xOf(t);
    return `<text x="${x.toFixed(1)}" y="${height - 10}" text-anchor="middle" fill="var(--texto-suave)" font-size="11">${i === 0 ? "0" : esc(fmtDuracion(t))}</text>`;
  }).join("");

  return `
    <svg class="grafico-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Línea de tiempo">
      ${grillaCarriles}
      ${marcas}
      ${puntosSvg}
      ${ticksX}
    </svg>`;
}

// ── Contenedor de Figura (Gráfico <-> Tabla) ────────────────────────────────

function tablaHtml(columnas, filas) {
  const ths = columnas.map((c) => `<th scope="col">${esc(c)}</th>`).join("");
  const trs = filas
    .map(
      (fila) =>
        `<tr>${fila
          .map((celda, idx) => (idx === 0 ? `<th scope="row">${esc(celda)}</th>` : `<td>${esc(celda)}</td>`))
          .join("")}</tr>`
    )
    .join("");
  return `<div class="tabla-scroll"><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
}

function figura({ id, titulo, nota, ancho, vacio, graficoHtml, tabla }) {
  const esTabla = vistaTabla.has(id);
  return `
    <figure class="grafico${ancho ? " grafico-ancho" : ""}">
      <div class="grafico-cabecera">
        <div class="grafico-titulo">
          <figcaption>${esc(titulo)}</figcaption>
          ${nota ? `<span class="info-boton" title="${esc(nota)}" aria-label="${esc(nota)}">i</span>` : ""}
        </div>
        ${
          vacio
            ? ""
            : `<button type="button" class="boton-alternar" data-toggle-figura="${esc(id)}">${esTabla ? "Gráfico" : "Tabla"}</button>`
        }
      </div>
      ${vacio ? `<p class="grafico-vacio">Sin datos</p>` : esTabla ? tablaHtml(tabla.columnas, tabla.filas) : graficoHtml}
    </figure>`;
}

// ── Renderizado principal ───────────────────────────────────────────────────

function notaCosto(m) {
  const { costo, disponible } = m.tokens;
  if (!disponible) return "sin datos de tokens";
  if (costo.parcial) return `parcial: sin precio para ${costo.sinPrecio.join(", ")}`;
  if (costo.usd === null) return `sin precio cargado para ${costo.sinPrecio.join(", ")}`;
  return "estimado a precio de lista";
}

function renderEstadoConexion(m) {
  const el = document.getElementById("estado-conexion");
  const textos = {
    envivo: "En vivo",
    reconectando: "Reconectando…",
    consultando: "Consultando cada 5 s (sin conexión en vivo)",
  };
  el.className = `metricas-conexion metricas-conexion-${estadoConexion}`;
  el.innerHTML = `<span class="estado-punto">●</span> ${textos[estadoConexion]}${
    m ? ` · actualizado a las ${fmtHoraExacta(m.generado)}` : ""
  }`;
}

function renderControles(m) {
  const f = leerFiltrosUrl();
  const chipsEl = document.getElementById("chips-alcance");
  chipsEl.innerHTML = `
    <button type="button" class="chip${f.alcance === "proyecto" ? " activo" : ""}" data-alcance="proyecto">
      Este proyecto (${esc(m.proyecto)} · ${m.totalSesionesDisponibles.proyecto})
    </button>
    <button type="button" class="chip${f.alcance === "todos" ? " activo" : ""}" data-alcance="todos">
      Todos los proyectos (${m.totalSesionesDisponibles.todos})
    </button>`;

  const selModelo = document.getElementById("filtro-modelo");
  selModelo.innerHTML =
    `<option value="">Todos</option>` +
    m.modelosDisponibles
      .map((mod) => `<option value="${esc(mod)}"${f.modelo === mod ? " selected" : ""}>${esc(mod)}</option>`)
      .join("");

  const selSesion = document.getElementById("filtro-sesion");
  selSesion.innerHTML =
    `<option value="">Todas</option>` +
    m.sesionesSelector
      .map(
        (s) =>
          `<option value="${esc(s.id)}"${f.sesion === s.id ? " selected" : ""}>${esc(s.id)} · ${esc(fmtFechaHora(s.inicio))}</option>`
      )
      .join("");

  document.getElementById("filtro-ventana").value = f.ventana;
  document.getElementById("filtro-detalle").checked = f.detalle;
}

function renderDashboard(m) {
  ultimoSnapshot = m;
  renderControles(m);
  renderEstadoConexion(m);

  const app = document.getElementById("app");
  if (m.vacio) {
    app.innerHTML = `
      <section class="estado-caja">
        <h2>Sin sesiones para los filtros actuales</h2>
        <p>No se encontraron eventos de Antigravity con estos filtros. Probá cambiar la ventana o pasar a "Todos los proyectos".</p>
      </section>`;
    return;
  }

  const { kpis } = m;
  const totalTokens = m.tokens.total;
  const sumaCache = totalTokens ? totalTokens.cacheLectura + totalTokens.cacheEscritura : 0;
  const paso = nombrePaso(m.porTiempo.pasoMin);
  const pasoTok = nombrePaso(m.tokens.porTiempo.pasoMin);

  const segmentosTokens = totalTokens
    ? TOKEN_SERIES.map((s) => ({ nombre: s.nombre, valor: totalTokens[s.id], color: s.color })).filter((s) => s.valor > 0)
    : [];
  const totalTokSuma = segmentosTokens.reduce((a, b) => a + b.valor, 0);

  const usosEspeciales = [
    ...m.subagentes.map((u) => ({ etiqueta: u.nombre, tipo: "subagente", kind: "otro", valor: u.n })),
    ...m.skills.map((u) => ({ etiqueta: u.nombre, tipo: "skill", kind: "skill", valor: u.n })),
    ...m.mcp.map((u) => ({ etiqueta: u.nombre, tipo: "mcp", kind: "mcp", valor: u.n })),
  ];

  const kpisHtml = `
    <section class="indicadores" aria-label="Indicadores">
      <div class="indicador"><span class="indicador-etiqueta">Sesiones</span><span class="indicador-valor">${fmtNum(kpis.sesiones)}</span></div>
      <div class="indicador"><span class="indicador-etiqueta">Prompts</span><span class="indicador-valor">${fmtNum(kpis.prompts)}</span></div>
      <div class="indicador"><span class="indicador-etiqueta">Llamadas a herramientas</span><span class="indicador-valor">${fmtNum(kpis.herramientas)}</span></div>
      <div class="indicador"><span class="indicador-etiqueta">Fallas de herramientas</span><span class="indicador-valor">${fmtPct(kpis.tasaFallas)}</span><span class="indicador-nota">${kpis.fallas} en total</span></div>
      <div class="indicador"><span class="indicador-etiqueta">Tokens (entrada / salida)</span><span class="indicador-valor">${totalTokens ? `${fmtCompacto(totalTokens.entrada)} / ${fmtCompacto(totalTokens.salida)}` : "n/d"}</span><span class="indicador-nota">${totalTokens ? `caché: ${fmtCompacto(sumaCache)}` : "sin datos"}</span></div>
      <div class="indicador"><span class="indicador-etiqueta">Costo estimado</span><span class="indicador-valor">${fmtUsd(m.tokens.costo.usd)}</span><span class="indicador-nota">${esc(notaCosto(m))}</span></div>
      <div class="indicador"><span class="indicador-etiqueta">Tiempo activo</span><span class="indicador-valor">${fmtDuracion(kpis.tiempoActivoMs)}</span></div>
      <div class="indicador"><span class="indicador-etiqueta">Caracteres devueltos al modelo</span><span class="indicador-valor">${fmtCompacto(kpis.caracteresDevueltos)}</span></div>
    </section>`;

  const enCursoHtml = m.enCurso.length
    ? `<p class="en-curso">Ahora ejecutando: ${m.enCurso
        .map((e) => `${esc(e.herramienta)} (sesión ${esc(e.sesion)}, hace ${fmtDuracion(e.desdeMs)})`)
        .join(" · ")}</p>`
    : "";

  const grillaHtml = `
    <div class="metricas-grilla">
      ${figura({
        id: "actividad",
        titulo: `Actividad por ${paso}`,
        nota: `Prompts, llamadas a herramientas y fines de turno agrupados cada ${paso}.`,
        ancho: true,
        vacio: m.porTiempo.puntos.length === 0,
        graficoHtml: svgSerieLinea(m.porTiempo.puntos, "Eventos"),
        tabla: {
          columnas: ["Inicio", "Eventos"],
          filas: m.porTiempo.puntos.map((p) => [fmtFechaHora(p.t), p.eventos]),
        },
      })}

      ${figura({
        id: "tokens-tiempo",
        titulo: `Tokens por ${pasoTok}, por tipo`,
        nota: "Tokens apilados por tipo en cada tramo. La caché de lectura suele ser la porción mayor del contexto.",
        ancho: true,
        vacio: m.tokens.porTiempo.puntos.length === 0,
        graficoHtml: svgBarrasApiladasTokens(m.tokens.porTiempo.puntos),
        tabla: {
          columnas: ["Inicio", "Entrada", "Salida", "Caché (lectura)"],
          filas: m.tokens.porTiempo.puntos.map((p) => [
            fmtFechaHora(p.t),
            fmtNum(p.porTipo.entrada),
            fmtNum(p.porTipo.salida),
            fmtNum(p.porTipo.cacheLectura),
          ]),
        },
      })}

      ${figura({
        id: "tokens-torta",
        titulo: "Distribución de tokens por tipo",
        nota: "Proporción de cada tipo de token sobre el total.",
        vacio: segmentosTokens.length === 0,
        graficoHtml: svgTorta(segmentosTokens, "tokens", fmtCompacto),
        tabla: {
          columnas: ["Tipo", "Tokens", "Del total"],
          filas: segmentosTokens.map((s) => [s.nombre, fmtNum(s.valor), fmtPct(s.valor / (totalTokSuma || 1))]),
        },
      })}

      ${figura({
        id: "tokens-modelo",
        titulo: "Tokens y costo por modelo",
        nota: "Total de tokens por modelo y su costo estimado según precios-modelos.json.",
        vacio: m.tokens.porModelo.length === 0,
        graficoHtml: svgBarrasHorizontales(
          m.tokens.porModelo.map((f) => {
            const sum = f.entrada + f.salida + f.cacheLectura + f.cacheEscritura;
            return {
              etiqueta: f.modelo,
              valor: sum,
              texto: `${fmtCompacto(sum)} · ${f.costoUsd === null ? "costo n/d" : fmtUsd(f.costoUsd)}`,
              color: "var(--agente-antigravity)",
            };
          }),
          "Tokens",
          fmtCompacto
        ),
        tabla: {
          columnas: ["Modelo", "Solicitudes", "Entrada", "Salida", "Caché", "Costo"],
          filas: m.tokens.porModelo.map((f) => [
            f.modelo,
            f.solicitudes,
            fmtNum(f.entrada),
            fmtNum(f.salida),
            fmtNum(f.cacheLectura),
            f.costoUsd === null ? "n/d" : fmtUsd(f.costoUsd),
          ]),
        },
      })}

      ${figura({
        id: "acciones-tipo",
        titulo: "Acciones por tipo",
        nota: "Proporción de lecturas, escrituras, ejecuciones y búsquedas sobre el total de llamadas.",
        vacio: m.acciones.length === 0,
        graficoHtml: svgTorta(
          m.acciones.map((a) => ({ nombre: a.kind, valor: a.n, color: colorKind(a.kind) })),
          "llamadas"
        ),
        tabla: {
          columnas: ["Tipo", "Llamadas", "Del total"],
          filas: m.acciones.map((a) => [a.kind, a.n, fmtPct(a.n / (kpis.herramientas || 1))]),
        },
      })}

      ${figura({
        id: "herramientas",
        titulo: "Herramientas más usadas",
        nota: "Conteo por nombre de herramienta de Antigravity, coloreado por tipo de acción.",
        vacio: m.herramientas.length === 0,
        graficoHtml: svgBarrasHorizontales(
          m.herramientas.map((h) => ({ etiqueta: h.nombre, valor: h.n, color: colorKind(h.kind) })),
          "Llamadas"
        ),
        tabla: {
          columnas: ["Herramienta", "Tipo", "Llamadas"],
          filas: m.herramientas.map((h) => [h.nombre, h.kind, h.n]),
        },
      })}

      ${figura({
        id: "fallas",
        titulo: "Fallas por herramienta",
        nota: "Llamadas cuyo paso de resultado terminó en ERROR o INVALID.",
        vacio: m.fallasPorHerramienta.length === 0,
        graficoHtml: svgBarrasHorizontales(
          m.fallasPorHerramienta.map((f) => ({ etiqueta: f.nombre, valor: f.n, color: "var(--error)" })),
          "Llamadas con error"
        ),
        tabla: {
          columnas: ["Herramienta", "Fallas"],
          filas: m.fallasPorHerramienta.map((f) => [f.nombre, f.n]),
        },
      })}

      ${figura({
        id: "duraciones",
        titulo: "Duración por tipo de acción",
        nota: "p50: mediana de duración. p95: peor caso habitual.",
        vacio: m.duraciones.length === 0,
        graficoHtml: svgDuraciones(m.duraciones),
        tabla: {
          columnas: ["Tipo", "Llamadas", "p50", "p95"],
          filas: m.duraciones.map((d) => [d.kind, d.n, fmtDuracion(d.p50Ms), fmtDuracion(d.p95Ms)]),
        },
      })}

      ${figura({
        id: "usos-especiales",
        titulo: "Subagentes, skills y MCP",
        nota: "Skills leídas (SKILL.md), subagentes invocados y herramientas MCP.",
        vacio: usosEspeciales.length === 0,
        graficoHtml: svgBarrasHorizontales(
          usosEspeciales.map((u) => ({
            etiqueta: u.etiqueta,
            valor: u.valor,
            texto: `${u.valor} · ${u.tipo}`,
            color: colorKind(u.kind),
          })),
          "Usos"
        ),
        tabla: {
          columnas: ["Nombre", "Tipo", "Usos"],
          filas: usosEspeciales.map((u) => [u.etiqueta, u.tipo, u.valor]),
        },
      })}

      ${figura({
        id: "leidos",
        titulo: "Archivos leídos",
        nota: "Veces que el agente leyó cada archivo.",
        vacio: m.archivosLeidos.length === 0,
        graficoHtml: svgBarrasHorizontales(
          m.archivosLeidos.map((a) => ({ etiqueta: a.nombre, valor: a.n, color: colorKind("leer") })),
          "Lecturas"
        ),
        tabla: {
          columnas: ["Archivo", "Lecturas"],
          filas: m.archivosLeidos.map((a) => [a.nombre, a.n]),
        },
      })}

      ${figura({
        id: "escritos",
        titulo: "Archivos escritos",
        nota: "Veces que el agente creó o editó cada archivo.",
        vacio: m.archivosEscritos.length === 0,
        graficoHtml: svgBarrasHorizontales(
          m.archivosEscritos.map((a) => ({ etiqueta: a.nombre, valor: a.n, color: colorKind("escribir") })),
          "Escrituras"
        ),
        tabla: {
          columnas: ["Archivo", "Escrituras"],
          filas: m.archivosEscritos.map((a) => [a.nombre, a.n]),
        },
      })}

      ${figura({
        id: "binarios",
        titulo: "Comandos de shell",
        nota: "Frecuencia de cada programa o subcomando ejecutado en terminal.",
        vacio: m.binarios.length === 0,
        graficoHtml: svgBarrasHorizontales(
          m.binarios.map((b) => ({ etiqueta: b.nombre, valor: b.n, color: colorKind("ejecutar") })),
          "Ejecuciones"
        ),
        tabla: {
          columnas: ["Comando", "Veces"],
          filas: m.binarios.map((b) => [b.nombre, b.n]),
        },
      })}

      ${figura({
        id: "timeline",
        titulo: m.lineaDeTiempo ? `Línea de tiempo de la sesión ${m.lineaDeTiempo.sesion}` : "Línea de tiempo",
        nota: "Puntos: llamadas a herramientas. Línea punteada: prompt. Línea llena: fin de turno. Cruz roja: falla.",
        ancho: true,
        vacio: !m.lineaDeTiempo || m.lineaDeTiempo.puntos.length === 0,
        graficoHtml: svgLineaDeTiempo(m.lineaDeTiempo),
        tabla: {
          columnas: ["Segundo", "Evento", "Tipo", "Resultado"],
          filas: (m.lineaDeTiempo?.puntos ?? []).map((p) => [
            Math.round(p.t / 1000),
            p.tipo === "prompt" ? "prompt" : p.tipo === "fin" ? "fin de turno" : "herramienta",
            p.kind ?? "",
            p.falla ? "falló" : "",
          ]),
        },
      })}
    </div>`;

  const cambiosHtml = m.tokens.cambiosDeModelo.length
    ? `
      <section class="tarjeta-seccion" aria-label="Cambios de modelo">
        <h2>Cambios de modelo</h2>
        <ul class="lista-meta">
          ${m.tokens.cambiosDeModelo
            .map(
              (c) => `<li>
                <span class="comando-meta">${esc(fmtFechaHora(c.t))} · sesión ${esc(c.sesion)}</span>
                <code>${esc(c.de)} → ${esc(c.a)}</code>
              </li>`
            )
            .join("")}
        </ul>
      </section>`
    : "";

  const sesionesHtml = `
    <section class="tarjeta-seccion" aria-label="Sesiones recientes">
      <h2>Sesiones recientes (clic para filtrar)</h2>
      <div class="tabla-scroll">
        <table>
          <thead>
            <tr>
              <th>Sesión</th>
              <th>Inicio</th>
              <th>Duración</th>
              <th>Prompts</th>
              <th>Herramientas</th>
              <th>Fallas</th>
              <th>Modelos</th>
              <th>Tokens (ent. / sal.)</th>
              <th>Caché</th>
              <th>Costo</th>
            </tr>
          </thead>
          <tbody>
            ${m.sesiones
              .map(
                (s) => `
              <tr class="fila-sesion" data-sesion="${esc(s.id)}">
                <th scope="row">${esc(s.id)}${s.enCurso ? `<span class="etiqueta-en-curso">en curso</span>` : ""}</th>
                <td>${esc(fmtFechaHora(s.inicio))}</td>
                <td>${esc(fmtDuracion(s.duracionMs))}</td>
                <td>${s.prompts}</td>
                <td>${s.herramientas}</td>
                <td>${s.fallas}</td>
                <td>${esc(s.modelos.length ? s.modelos.join(" → ") : "n/d")}</td>
                <td>${s.tokens ? `${fmtCompacto(s.tokens.entrada)} / ${fmtCompacto(s.tokens.salida)}` : "n/d"}</td>
                <td>${s.tokens ? fmtCompacto(s.tokens.cacheLectura) : "n/d"}</td>
                <td>${s.costoUsd === null ? "n/d" : `${fmtUsd(s.costoUsd)}${s.costoParcial ? " (parcial)" : ""}`}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>`;

  const comandosHtml = m.comandosRecientes
    ? `
      <section class="tarjeta-seccion" aria-label="Comandos recientes">
        <h2>Comandos recientes (secretos redactados)</h2>
        ${
          m.comandosRecientes.length === 0
            ? `<p class="grafico-vacio">Sin comandos en este rango</p>`
            : `<ul class="lista-meta">
                ${m.comandosRecientes
                  .map(
                    (c) => `<li>
                      <span class="comando-meta">${esc(fmtFechaHora(c.ts))} · sesión ${esc(c.sesion)}</span>
                      <code>${esc(c.comando)}</code>
                    </li>`
                  )
                  .join("")}
              </ul>`
        }
      </section>`
    : "";

  app.innerHTML = kpisHtml + enCursoHtml + grillaHtml + cambiosHtml + sesionesHtml + comandosHtml;
}

// ── Conexión en vivo (SSE + fallback polling) ───────────────────────────────

function detenerConexion() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

async function fetchSnapshot() {
  const res = await fetch(`/metrics/api?${construirQuery()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function activarPolling() {
  detenerConexion();
  estadoConexion = "consultando";
  renderEstadoConexion(ultimoSnapshot);
  const consultar = async () => {
    try {
      const data = await fetchSnapshot();
      renderDashboard(data);
    } catch {
      document.getElementById("app").innerHTML = `<section class="estado-caja"><h2>No se pudo conectar</h2><p>Verificá que <code>node tools/metrics/server.mjs</code> siga corriendo.</p></section>`;
    }
  };
  consultar();
  pollingTimer = setInterval(consultar, 5000);
}

function conectar() {
  detenerConexion();
  fallosSSE = 0;
  estadoConexion = "reconectando";
  renderEstadoConexion(ultimoSnapshot);

  const es = new EventSource(`/metrics/api/events?${construirQuery()}`);
  eventSource = es;

  es.addEventListener("metricas", (ev) => {
    fallosSSE = 0;
    estadoConexion = "envivo";
    renderDashboard(JSON.parse(ev.data));
  });

  es.onerror = () => {
    fallosSSE += 1;
    if (fallosSSE >= 3) {
      activarPolling();
    } else {
      estadoConexion = "reconectando";
      renderEstadoConexion(ultimoSnapshot);
    }
  };
}

// ── Eventos de UI ───────────────────────────────────────────────────────────

document.getElementById("chips-alcance").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-alcance]");
  if (btn) actualizarFiltro("alcance", btn.dataset.alcance);
});

document.getElementById("filtro-modelo").addEventListener("change", (e) => {
  actualizarFiltro("modelo", e.target.value);
});

document.getElementById("filtro-ventana").addEventListener("change", (e) => {
  actualizarFiltro("ventana", e.target.value);
});

document.getElementById("filtro-sesion").addEventListener("change", (e) => {
  actualizarFiltro("sesion", e.target.value);
});

document.getElementById("filtro-detalle").addEventListener("change", (e) => {
  actualizarFiltro("detalle", e.target.checked ? "1" : "");
});

document.getElementById("app").addEventListener("click", (e) => {
  const btnToggle = e.target.closest("[data-toggle-figura]");
  if (btnToggle) {
    const id = btnToggle.dataset.toggleFigura;
    if (vistaTabla.has(id)) vistaTabla.delete(id);
    else vistaTabla.add(id);
    if (ultimoSnapshot) renderDashboard(ultimoSnapshot);
    return;
  }

  const fila = e.target.closest("[data-sesion]");
  if (fila) {
    const actual = leerFiltrosUrl().sesion;
    const id = fila.dataset.sesion;
    actualizarFiltro("sesion", actual === id ? "" : id);
  }
});

conectar();
