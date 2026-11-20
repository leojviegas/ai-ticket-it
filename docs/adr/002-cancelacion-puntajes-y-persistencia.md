# ADR 002: Cancelación Concurrente, Cálculo de Puntajes, Direccionalidad de Reseñas y Persistencia en Memoria

- **Estado**: Aceptado
- **Fecha**: 2026-11-20
- **Origen**: Definiciones resueltas a partir de `docs/dudas.md` (`DUDA-01` a `DUDA-06`)

---

## Decisiones Adoptadas

### 1. Cancelación desde `PENDIENTE` / `CONFIRMADA` y manejo de concurrencia (`DUDA-01`)
- **Decisión**: Se implementan ambas protecciones de forma complementaria:
  1. **Refresco en vista del organizador**: Cuando una compra pasa a `CANCELADA`, en la vista del organizador figura directamente como `CANCELADA` con el aviso de que corresponde emitir reembolso y el botón **Reembolsar** habilitado (ocultando la acción de confirmar).
  2. **Protección de concurrencia en Back-End**: Si el organizador tenía la vista desactualizada e intenta confirmar una compra que el comprador acaba de cancelar, la máquina de estados en `Compra.actualizarEstado` rechaza la transición `CANCELADA -> CONFIRMADA` devolviendo `409 Conflict`, ante lo cual el Front-End informa lo sucedido y actualiza el estado de la compra en pantalla.

### 2. Fórmula del puntaje del organizador (`DUDA-02`)
- **Decisión**: Se adopta el **promedio global de todas las reseñas individuales** recibidas en todos los eventos organizados por ese usuario (suma de todas las puntuaciones dividida por la cantidad total de reseñas).
- **Justificación**: Cada reseña individual tiene el mismo peso, evitando que un evento con una sola reseña distorsione la reputación construida en eventos masivos, alineado con el estándar de plataformas reales.

### 3. Direccionalidad unidireccional `Resenia -> Evento` (`DUDA-03`)
- **Decisión**: Se mantiene estrictamente la relación unidireccional del Diagrama Tentativo donde `Resenia` conoce a su `Evento`, sin agregar una colección `resenias[]` dentro de `Evento`.
- **Justificación**: Respeta el diagrama oficial, evita referencias circulares en memoria y serialización JSON, y facilita consultar todas las reseñas de un organizador desde `ReseniaRepository`.

### 4. Persistencia estrictamente en memoria (`DUDA-04`)
- **Decisión**: Confirmado que no se utiliza ninguna base de datos externa (ni SQL ni NoSQL) ni almacenamiento en disco. Todo reside en RAM dentro de `src/repositories/` y al reiniciarse el proceso servidor los datos vuelven al estado inicial provisto por `data/seeders/`.

### 5. Puntajes calculados al vuelo (*on-the-fly*) en Evento y Organizador (`DUDA-05`)
- **Decisión**: Tanto el **puntaje promedio propio de cada evento** (mostrado en la sección del evento) como el **puntaje general del organizador** (mostrado en su perfil/sección y usado para ordenar el catálogo) se calculan dinámicamente en el momento a partir de las `Resenia` existentes, sin persistirse como campos mutables en `Evento` ni en `Usuario`.
- **Justificación**: Garantiza consistencia absoluta (fuente única de verdad), mantiene limpias las entidades del dominio respecto al diagrama y el costo computacional en memoria es despreciable.

### 6. Cancelación de compra `PENDIENTE` por parte del Organizador (`DUDA-06`)
- **Decisión**: Se adopta la **Opción A**:
  - En estado **`PENDIENTE`**: tanto el **comprador** como el **organizador** pueden cancelar la compra (pasando a `CANCELADA`, restituyendo el cupo al `TipoEntrada` y registrando en `CambioEstadoCompra.quien` quién ejecutó la acción).
  - En estado **`CONFIRMADA`**: **solo el comprador** puede cancelar la compra (siempre que el evento aún no haya ocurrido).
  - En estado **`CANCELADA`**: si nunca hubo pago real queda en `CANCELADA`; si hubo pago previo o transferencia acreditada tarde, el organizador dispone del botón **Reembolsar** para pasarla a `REEMBOLSADA` y del chat abierto en todo momento.
