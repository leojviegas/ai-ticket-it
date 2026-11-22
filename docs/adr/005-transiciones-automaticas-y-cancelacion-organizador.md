# ADR 005: Transición Automática a `UTILIZADA`, Cancelación de Confirmadas por Organizador y Atajo en Chat

- **Estado**: Aceptado
- **Fecha**: 2026-11-22
- **Origen**: Definición explícita del usuario durante pruebas en Expo Go; reemplaza parcialmente el punto 6 de `ADR 002` (`DUDA-06`).

---

## Contexto

Durante las pruebas reales de la aplicación mobile se detectaron tres desajustes entre el flujo esperado y la implementación heredada de `DUDA-06`:
1. Desde el panel de gestión del evento, el organizador no tenía opción de cancelar una compra en estado `CONFIRMADA` antes del evento (por ejemplo ante incumplimiento de pago o acuerdo por chat), sino que se mostraba un botón manual `Marcar utilizada`.
2. El paso de `CONFIRMADA` a `UTILIZADA` no debe quedar sujeto a una acción manual del organizador: debe producirse automáticamente al alcanzarse la fecha y hora del evento (`evento.fecha <= ahora`).
3. Al conversar con un comprador desde el chat de una compra (`ConversacionScreen`), el banner superior mostraba evento y estado pero no permitía ir directamente a `GestionEventoScreen` para gestionar la compra desde allí.

---

## Decisión

1. **Cancelación por Organizador desde `PENDIENTE` y `CONFIRMADA`**:
   - Se elimina la restricción en `CompraService.cancelarCompra` que bloqueaba al organizador cancelar compras `CONFIRMADA`. Tanto comprador como organizador pueden ejecutar `POST /api/compras/:id/cancelar` en `PENDIENTE` o `CONFIRMADA` mientras el evento no haya ocurrido (`evento.fecha > ahora`), restituyendo el cupo y registrando `CambioEstadoCompra.quien`.
   - En `GestionEventoScreen`, al seleccionar compras `PENDIENTE` o `CONFIRMADA` de un evento futuro se habilita el botón **Cancelar** (`POST /api/compras/:id/cancelar`).
2. **Transiciones Automáticas al Alcanzarse `evento.fecha` (`CONFIRMADA -> UTILIZADA` y `PENDIENTE -> CANCELADA`)**:
   - `Compra.sincronizarEstadoPorFecha(fechaActual)` (invocada automáticamente en `CompraRepository.findById` y `CompraRepository.findAll`) evalúa `this.evento.yaOcurrio(fechaActual)`:
     - Si la compra está `CONFIRMADA`, transiciona automáticamente a `UTILIZADA` registrando el `CambioEstadoCompra` con la fecha del evento.
     - Si la compra permaneció `PENDIENTE` al ocurrir el evento, se cancela automáticamente pasando a `CANCELADA`, restituye el cupo al `TipoEntrada` y registra el `CambioEstadoCompra` con la fecha del evento, evitando que queden compras pendientes bloqueadas sin transición posible.
   - Se elimina `UTILIZADA` de `actualizarEstadoCompraSchema` (`PATCH /api/compras/:id/estado`), se rechaza en `CompraService.actualizarEstado` con `BusinessRuleError`, y se quita el botón **Marcar utilizada** de `GestionEventoScreen`.
3. **Atajo en el Banner del Chat (`ConversacionScreen`)**:
   - El banner superior de `ConversacionScreen` pasa a ser interactivo (`Pressable`): si el usuario autenticado es el organizador del evento navega a `/gestionar-evento/:eventoId`; si es el comprador, navega a `/evento/:eventoId`.

---

## Consecuencias

- Se evita inconsistencia temporal en RAM sin necesitar un cron en segundo plano que mutaría estado en paralelo con tests o relojes simulados; la sincronización al leer en `CompraRepository` es determinística y testeable con `fechaActual` inyectada.
- Al alcanzarse `evento.fecha`, las entradas confirmadas pasan automáticamente a `UTILIZADA`, bloquean futuras cancelaciones y habilitan al comprador a calificar el evento.
