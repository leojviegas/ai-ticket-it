# Registro de Dudas de Diseño (`docs/dudas.md`)

> **Regla para el Agente de IA**: Este archivo debe leerse al inicio de cada turno/prompt antes de ejecutar cualquier cambio de código. Si existen dudas nuevas (sin la marca `[LEIDA]`) bajo la sección **1. Dudas Pendientes (Activas)**, el agente debe analizarlas, responderlas con sus alternativas e implicancias y **marcarlas inmediatamente con `[LEIDA]`** en este mismo archivo para no volver a mencionarlas ni responderlas en futuros chats. Las dudas marcadas con `[LEIDA]` se ignoran hasta que el desarrollador indique su decisión final, momento en el cual se documenta en `docs/adr/` y se mueve a la sección **2. Historial de Dudas Resueltas**.

---

## 1. Dudas Pendientes (Activas)

<!-- Escribí acá cualquier duda nueva. Cuando el agente la lea y responda, le agregará la marca [LEIDA] para no repetirla en chats posteriores. -->

---

## 2. Historial de Dudas Resueltas (Movidas a `docs/adr/`)

| ID | Tema | Decisión Tomada | ADR Asociado |
| :--- | :--- | :--- | :--- |
| `DUDA-01` | Cancelación desde `PENDIENTE` / `CONFIRMADA` y concurrencia | Se combinan ambas: refresco directo a `CANCELADA` con acción de reembolso + rechazo `409 Conflict` en backend si se intenta confirmar una compra ya cancelada. | [ADR 002](./adr/002-cancelacion-puntajes-y-persistencia.md) |
| `DUDA-02` | Fórmula de puntaje del organizador | Opción A: promedio global de todas las reseñas individuales de todos sus eventos. | [ADR 002](./adr/002-cancelacion-puntajes-y-persistencia.md) |
| `DUDA-03` | Direccionalidad `Resenia -> Evento` | Se mantiene unidireccional (`Resenia` apunta a `Evento`), fiel al diagrama tentativo. | [ADR 002](./adr/002-cancelacion-puntajes-y-persistencia.md) |
| `DUDA-04` | Persistencia en memoria | Confirmada persistencia pura en RAM (sin BD externa); al reiniciar el proceso se restauran los seeders. | [ADR 002](./adr/002-cancelacion-puntajes-y-persistencia.md) |
| `DUDA-05` | Puntaje calculado vs. almacenado | Calculado al vuelo (*on-the-fly*) tanto para el puntaje promedio de cada evento como para el puntaje general del organizador. | [ADR 002](./adr/002-cancelacion-puntajes-y-persistencia.md) |
| `DUDA-06` | Cancelación de compra `PENDIENTE` por organizador | Opción A: en `PENDIENTE` pueden cancelar comprador u organizador; en `CONFIRMADA` solo el comprador. Si hubo pago, desde `CANCELADA` el organizador puede pasarla a `REEMBOLSADA`. | [ADR 002](./adr/002-cancelacion-puntajes-y-persistencia.md) |
| `DUDA-07` | Uso de `index.js` en `repositories/`, `services/` y `domain/` | Opción A: mantener `repositories/index.js` y `services/index.js` como Composition Root con inyección por constructor, y `domain/index.js` como fachada del dominio. | [ADR 003](./adr/003-inyeccion-dependencias-y-barrels-index.md) |
