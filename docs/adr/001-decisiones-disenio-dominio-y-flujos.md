# ADR 001: Decisiones de Diseño sobre el Modelo de Dominio y Flujos

- **Estado**: Aceptado
- **Fecha**: 2026-10-28

---

## Contexto

El enunciado de **AI Ticket It** provee un **Diagrama Tentativo** de dominio y 12 Casos de Uso funcionales. Este documento registra las decisiones de diseño acordadas para los puntos abiertos del enunciado antes de la implementación.

---

## Decisiones Adoptadas

### 1. Identificadores Únicos (`id`) Autoincrementales
- **Decisión**: Todas las entidades utilizan un **`id` numérico entero autoincremental normal (`1, 2, 3...`)**, facilitando las pruebas manuales, los tests unitarios en Jest y la depuración durante el desarrollo.

### 2. Interfaz Única Unificada para `Usuario` (Estilo YouTube / Studio)
- **Contexto**: En el diagrama existe una única clase `Usuario` (`nombre`, `apellido`, `favoritos: Evento[]`). Cualquier usuario de la plataforma puede tanto asistir a eventos comprando entradas como publicar y organizar sus propios eventos.
- **Decisión**:
  - Se diseña **una única vista/experiencia unificada para todos los usuarios**, donde el usuario puede explorar eventos, gestionar sus compras/favoritos y además acceder a una sección dedicada de **Gestión / Estudio de Eventos** (al estilo *YouTube / YouTube Studio*) para publicar eventos propios y administrar las ventas, estados y consultas de los eventos que organiza.

### 3. Ciclo de Vida de `Compra` en Pasos Explícitos (`PENDIENTE` → `CONFIRMADA` y `CANCELADA` → `REEMBOLSADA`)
- **Decisión**:
  1. **Creación en `PENDIENTE`**: Al realizar una compra (validando y reservando el cupo disponible en `TipoEntrada`), la `Compra` nace en estado **`PENDIENTE`** (sin requerir pasarela de pago externa).
  2. **Confirmación por el Organizador**: El organizador del evento confirma la compra, transicionándola de `PENDIENTE` a **`CONFIRMADA`**.
  3. **Utilización de la Entrada**: Al asistir al evento, la compra pasa de `CONFIRMADA` a **`UTILIZADA`**, lo cual habilita al comprador a puntuar y comentar el evento (`Resenia`).
  4. **Cancelación por el Comprador (CU 7 y CU 8)**:
     - El comprador puede cancelar su compra siempre que **no se encuentre en estado `UTILIZADA`** (ni ya cancelada/reembolsada) y **el evento aún no se haya realizado** (`evento.fecha > ahora`).
     - Al cancelar, la compra pasa a estado **`CANCELADA`** y **restituye inmediatamente el cupo** (`compra.cantidad`) al `TipoEntrada`.
  5. **Reembolso por el Organizador**:
     - Una vez que la compra está en estado **`CANCELADA`**, el organizador dispone de la acción/botón de reembolsar, y recién en ese momento la compra pasa al estado **`REEMBOLSADA`**.
  - Todo cambio de estado mediante `actualizarEstado(nuevoEstado, quien, fechaHora)` registra su correspondiente instancia de `CambioEstadoCompra`.

### 4. Relación entre la `Resenia` del Evento y el Puntaje del Organizador (CU 9, CU 10 y CU 11)
- **Contexto**:
  - En el diagrama, `Resenia` está asociada directamente a `Evento` (`comprador: Usuario`, `evento: Evento`, `detalle: String`, `puntuacion: Double`), porque los compradores califican **el evento puntual al que asistieron** una vez utilizada su entrada (CU 9).
  - Sin embargo, cuando un comprador explora eventos futuros para comprar entradas, esos eventos aún no ocurrieron (y por ende todavía no tienen reseñas propias). Por eso el CU 10 pide *"que las reseñas de eventos anteriores se visualicen en los Eventos de cada organizador para conocer experiencias previas antes de comprar"* y el CU 11 pide ordenar eventos por *"puntaje del organizador"*.
- **Decisión**:
  - Cada `Resenia` se crea sobre un **`Evento` específico** (con puntuación numérica de `1` a `5` y comentario escrito) una vez que la compra del usuario para ese evento está en estado `UTILIZADA`.
  - El **puntaje del organizador** se calcula dinámicamente como el **promedio de las puntuaciones de todas las `Resenia` recibidas por los eventos organizados por ese `Usuario`**, y en la página de cualquier evento suyo se pueden consultar las reseñas de sus eventos anteriores.

### 5. Precio del Evento para Ordenamiento y Filtrado (CU 11)
- **Decisión**:
  - `evento.tuPrecioEstaEntre(min, max)` retorna `true` si al menos uno de sus `TipoEntrada` tiene `precio >= min && precio <= max`.
  - Para ordenar eventos por **precio**, se utiliza el **precio mínimo** (`obtenerPrecioMinimo()`) entre los `tiposEntrada` del evento.
