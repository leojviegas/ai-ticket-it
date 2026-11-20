# Dashboard local de métricas de Antigravity

Herramienta standalone (sin dependencias externas ni hooks adicionales) que lee directamente los archivos `transcript.jsonl` generados por Antigravity en `~/.gemini/antigravity/brain/` y expone un tablero de observabilidad en vivo.

## Cómo levantarlo

Desde la raíz del repositorio:

```bash
node tools/metrics/server.mjs
```

- Intenta iniciar en `127.0.0.1:80` para quedar disponible en `http://localhost/metrics`.
- Si el puerto `80` está ocupado o restringido por el sistema operativo, hace fallback automático al puerto `4321` (`http://localhost:4321/metrics`).
- También podés elegir un puerto específico con `METRICS_PORT`:

```powershell
$env:METRICS_PORT=4321; node tools/metrics/server.mjs
```

## Privacidad y alcance

- Escucha exclusivamente en `127.0.0.1` y rechaza con `403` cualquier solicitud fuera de loopback.
- No expone el contenido de prompts, razonamientos internos ni archivos completos: solo agregados, rutas relativas al repositorio, conteos, duraciones y tokens.
- El modo detalle de comandos viene desactivado por defecto y redacta credenciales, tokens y emails.
- Por defecto filtra las sesiones correspondientes a `ai-ticket-it`, con un selector en la interfaz para incluir todas las sesiones de Antigravity.

## Precios de modelos

Editá `tools/metrics/precios-modelos.json` para agregar o actualizar tarifas en USD por millón de tokens. Los modelos sin tarifa cargada muestran costo `n/d`.
