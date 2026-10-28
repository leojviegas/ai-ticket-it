# ADR 001: Decisiones de Diseño sobre Grises del Enunciado y Modelo de Dominio

- **Estado**: Aceptado
- **Fecha**: 2026-10-28

---

## Contexto

El enunciado de **AI Ticket It** provee un **Diagrama Tentativo** de dominio y 12 Casos de Uso funcionales. Sin embargo, como en todo problema de diseño de software, existen aspectos ("grises") no explicitados en el diagrama conceptual que deben definirse con precisión antes de escribir las especificaciones (`specs/`) y los tests de mutación con Stryker.

---

## Decisiones Adoptadas

### 1. Identificadores Únicos (`id`) Autoincrementales
- **Problema**: El diagrama conceptual omite los atributos `id` de las entidades.
- **Decisión (Definida por el usuario)**: Todas las entidades utilizarán un **`id` numérico autoincremental normal (`1, 2, 3...`)** en lugar de UUIDs, facilitando las pruebas manuales, los tests unitarios y la depuración durante el desarrollo.

### 2. Modelo de `Usuario` y Roles (Comprador / Organizador)
- **Problema**: El diagrama define una única clase `Usuario` (`nombre`, `apellido`, `favoritos: Evento[]`), mientras que los casos de uso distinguen acciones de **Comprador** y **Organizador**. Además, no se pide un sistema de autenticación con contraseñas o servidores externos.
- **Decisión**:
  - Se respeta la única clase `Usuario` del diagrama. Un usuario es `organizador` de los eventos que crea (`evento.organizador`) y `comprador` de las compras que realiza (`compra.comprador`).
  - En el Front-End (React Native) se incluirá un **Selector Rápido de Usuario / Rol (Comprador ↔ Organizador)** alimentado por los usuarios semilla del Back-End. Esto permite demostrar en vivo ambos roles (ej. enviar un mensaje como comprador y responderlo inmediatamente como organizador) de forma fluida durante el video de entrega de 5 a 10 minutos.

### 3. Máquina de Estados de `Compra`, Reembolso y `CambioEstadoCompra`
- **Problema**:
  - Existen 5 estados en `EstadoCompra`: `PENDIENTE`, `CONFIRMADA`, `UTILIZADA`, `CANCELADA`, `REEMBOLSADA`.
  - Los Casos de Uso 7 y 8 establecen que el comprador puede cancelar una compra para obtener el reembolso siempre que **no se encuentre en estado `UTILIZADA`** y **el evento aún no se haya realizado**.
- **Decisión**:
  - Una compra se crea inicialmente en estado `CONFIRMADA` (o `PENDIENTE` si se especifica, permitiendo confirmarla) y registra su `CambioEstadoCompra` inicial.
  - Método `actualizarEstado(nuevoEstado, quien = this.comprador, fechaHora = new Date())`:
    - Mantiene compatibilidad total con la firma del diagrama `actualizarEstado(EstadoCompra)` si se invoca con un solo argumento.
    - Valida las transiciones permitidas:
      - `PENDIENTE` → `CONFIRMADA` | `CANCELADA`
      - `CONFIRMADA` → `UTILIZADA` | `CANCELADA`
      - `CANCELADA` → `REEMBOLSADA`
    - Cualquier otra transición lanza `InvalidStateTransitionError` (HTTP 409).
    - Registra un nuevo objeto `CambioEstadoCompra({ compra: this, estado: nuevoEstado, quien, fechaHora })` en el historial de la compra.
  - **Flujo de Cancelación y Reembolso**:
    - Cuando el comprador solicita cancelar una compra:
      1. Se verifica que `compra.estado !== EstadoCompra.UTILIZADA` y no esté ya cancelada/reembolsada.
      2. Se verifica que `compra.evento.fecha > fechaActual` (el evento aún no ocurrió).
      3. Si la compra estaba `CONFIRMADA`, pasa por `CANCELADA` y se marca como `REEMBOLSADA` (registrando los `CambioEstadoCompra` correspondientes), y se restituye la `cantidad` de entradas al `cupo` del `TipoEntrada`. Si estaba `PENDIENTE`, pasa a `CANCELADA` y también libera el cupo reservado.

### 4. Gestión de Cupo en `TipoEntrada`
- **Problema**: El Caso de Uso 12 exige comprar sin superar el cupo disponible y el Caso de Uso 2 exige que el organizador visualice cuántas entradas quedan disponibles de cada tipo.
- **Decisión**:
  - `TipoEntrada` implementa `hayCupoPara(cantidad)`: devuelve `true` si `Number.isInteger(cantidad) && cantidad > 0 && this.cupo >= cantidad`, y `false` en caso contrario.
  - Además incorpora métodos de dominio `descontarCupo(cantidad)` y `restituirCupo(cantidad)` (que validan invariantes y lanzan `DomainValidationError` si no hay cupo suficiente o si la cantidad es inválida).

### 5. Cálculo de Días Restantes (Caso de Uso 1)
- **Problema**: El comprador debe ver cuántos días faltan para el evento únicamente cuando la compra está en estado `CONFIRMADA`.
- **Decisión**: `Compra` expone el método/cálculo `calcularDiasParaEvento(fechaReferencia = new Date())`:
  - Si `this.estado !== EstadoCompra.CONFIRMADA`, retorna `null`.
  - Si `this.estado === EstadoCompra.CONFIRMADA`, retorna `Math.max(0, Math.ceil((this.evento.fecha.getTime() - fechaReferencia.getTime()) / (1000 * 60 * 60 * 24)))`.

### 6. Precio del Evento, Filtrado y Ordenamiento (Casos de Uso 3 y 11)
- **Problema**: Un `Evento` posee múltiples `TipoEntrada[]` con distintos precios. El diagrama incluye `tuPrecioEstaEntre(min, max): Boolean` y el CU 11 solicita ordenar eventos por `precio`, `fecha` y `puntaje del organizador`.
- **Decisión**:
  - `evento.tuPrecioEstaEntre(min, max)` retorna `true` si al menos un `TipoEntrada` del evento cumple `tipo.precio >= min && tipo.precio <= max`.
  - Para ordenar por `precio`, se utiliza el menor precio (`precioMinimo`) entre los `tiposEntrada` del evento.
  - Para ordenar por `puntaje del organizador`, se calcula el promedio de `puntuacion` de todas las `Resenia` cuyos eventos pertenecen a `evento.organizador` (si no posee reseñas, su puntaje promedio es `0`).

### 7. Validación de `Resenia` (Casos de Uso 9 y 10)
- **Problema**: Cuándo puede un comprador reseñar un evento y qué valores son válidos.
- **Decisión**:
  - `Resenia` valida en su constructor que `comprador` y `evento` existan, que `detalle` sea un string no vacío y que `puntuacion` sea un número en el rango `[1, 5]`.
  - A nivel de regla de negocio (`ReseniaService`), solo se permite crear una reseña si el comprador tiene al menos una `Compra` para ese `Evento` en estado `UTILIZADA` y aún no ha dejado reseña para dicho evento.
  - En la vista de un `Evento`, se exponen tanto las reseñas propias del evento como las reseñas de eventos anteriores del mismo `organizador` (CU 10).

