# Especificación de Dominio 01: Entidades, Enumeraciones e Invariantes

## 1. Propósito y Alcance

Define el contrato exacto de todas las clases de `backend/src/domain/entities/`, las enumeraciones de `backend/src/domain/enums/` y los errores de `backend/src/domain/errors/DomainError.js`, respetando 1:1 el **Diagrama Tentativo** ([docs/diagrama-clases.md](../../docs/diagrama-clases.md)) y detallando las condiciones de borde para los tests con **Jest** y **Stryker Mutator**.

---

## 2. Errores de Dominio (`backend/src/domain/errors/DomainError.js`)

- **`DomainError`** (`extends Error`): Clase base con `message` y `details = null`.
- **`DomainValidationError`** (`extends DomainError`): Se lanza ante cualquier violación de invariantes en constructores o métodos de dominio (mapea a HTTP `400`).
- **`InvalidStateTransitionError`** (`extends DomainError`): Se lanza ante transiciones inválidas de `EstadoCompra` o intentos de cancelación no permitidos por estado (mapea a HTTP `409`).

---

## 3. Enumeración `EstadoCompra` (`backend/src/domain/enums/estadoCompra.js`)

Objeto congelado con `Object.freeze`:
```js
export const EstadoCompra = Object.freeze({
  PENDIENTE: "PENDIENTE",
  CONFIRMADA: "CONFIRMADA",
  UTILIZADA: "UTILIZADA",
  CANCELADA: "CANCELADA",
  REEMBOLSADA: "REEMBOLSADA"
});
```

---

## 4. Entidades de Dominio (`backend/src/domain/entities/`)

### 4.1. `Categoria` (`categoria.js`)
- **Atributos**:
  - `id: Number (Int autoincremental: 1, 2, 3...)`
  - `nombre: String`
  - `descripcion: String`
- **Invariantes de Constructor**:
  - Si `!nombre || typeof nombre !== "string" || !nombre.trim()` → `DomainValidationError("El nombre de la categoría es obligatorio")`.
  - Si `!descripcion || typeof descripcion !== "string" || !descripcion.trim()` → `DomainValidationError("La descripción de la categoría es obligatoria")`.

---

### 4.2. `Usuario` (`usuario.js`)
- **Atributos**:
  - `id: Number (Int autoincremental: 1, 2, 3...)`
  - `nombre: String`
  - `apellido: String`
  - `favoritos: Evento[]` (default `[]`)
- **Invariantes de Constructor**:
  - Si `!nombre || typeof nombre !== "string" || !nombre.trim()` → `DomainValidationError("El nombre del usuario es obligatorio")`.
  - Si `!apellido || typeof apellido !== "string" || !apellido.trim()` → `DomainValidationError("El apellido del usuario es obligatorio")`.
- **Métodos de Dominio**:
  - `agregarFavorito(evento)`: Agrega `evento` a `this.favoritos` si no estaba ya incluido (comparando por `id`). Si `!evento` lanza `DomainValidationError`.
  - `quitarFavorito(eventoId)`: Filtra `this.favoritos` removiendo el evento con ese `id`.
  - `esFavorito(eventoId): Boolean`: Retorna `true` si el evento está en `this.favoritos`.

---

### 4.3. `TipoEntrada` (`tipoEntrada.js`)
- **Atributos**:
  - `id: Number (Int autoincremental: 1, 2, 3...)`
  - `nombre: String`
  - `descripcion: String`
  - `precio: Number (Double)`
  - `cupo: Number (Int)`
- **Invariantes de Constructor**:
  - `nombre` no vacío (`DomainValidationError("El nombre del tipo de entrada es obligatorio")`).
  - `descripcion` no vacía (`DomainValidationError("La descripción del tipo de entrada es obligatoria")`).
  - `typeof precio !== "number" || Number.isNaN(precio) || precio < 0` → `DomainValidationError("El precio debe ser un número mayor o igual a 0")`.
  - `!Number.isInteger(cupo) || cupo < 0` → `DomainValidationError("El cupo debe ser un entero mayor o igual a 0")`.
- **Métodos de Dominio (Diagrama y Soporte)**:
  - **`hayCupoPara(cantidad: Int): Boolean`** *(Método del Diagrama)*:
    - Retorna `true` si y solo si `Number.isInteger(cantidad) && cantidad > 0 && this.cupo >= cantidad`. En caso contrario retorna `false`.
    - *Bordes Stryker*: probar `cantidad = 0`, `cantidad = -1`, `cantidad = this.cupo`, `cantidad = this.cupo + 1`, `cantidad = 1.5`.
  - **`descontarCupo(cantidad: Int): void`**:
    - Si `!this.hayCupoPara(cantidad)` → lanza `DomainValidationError("No hay cupo suficiente para la cantidad solicitada")`.
    - Resta `this.cupo -= cantidad`.
  - **`restituirCupo(cantidad: Int): void`**:
    - Si `!Number.isInteger(cantidad) || cantidad <= 0` → lanza `DomainValidationError("La cantidad a restituir debe ser un entero positivo")`.
    - Suma `this.cupo += cantidad`.

---

### 4.4. `Evento` (`evento.js`)
- **Atributos**:
  - `id: Number (Int autoincremental: 1, 2, 3...)`
  - `nombre: String`
  - `descripcion: String`
  - `categoria: Categoria`
  - `fecha: Date`
  - `tiposEntrada: TipoEntrada[]`
  - `multimedia: String[]` (default `[]`)
  - `organizador: Usuario`
- **Invariantes de Constructor**:
  - `nombre` y `descripcion` obligatorios y no vacíos.
  - `categoria` obligatoria.
  - `organizador` obligatorio.
  - `fecha` obligatoria y válida (`fecha instanceof Date` o convertible a `Date` válida).
  - `!Array.isArray(tiposEntrada) || tiposEntrada.length === 0` → `DomainValidationError("El evento debe tener al menos un tipo de entrada")`.
- **Métodos de Dominio (Diagrama y Soporte)**:
  - **`tuPrecioEstaEntre(min: Int, max: Int): Boolean`** *(Método del Diagrama)*:
    - Retorna `true` si al menos un `tipo` en `this.tiposEntrada` cumple `tipo.precio >= min && tipo.precio <= max`.
    - *Bordes Stryker*: probar cuando `tipo.precio === min`, `tipo.precio === max`, `tipo.precio < min` y `tipo.precio > max`.
  - **`obtenerPrecioMinimo(): Number`**:
    - Retorna `Math.min(...this.tiposEntrada.map(t => t.precio))` para el ordenamiento por precio (Caso de Uso 11).
  - **`yaOcurrio(fechaReferencia = new Date()): Boolean`**:
    - Retorna `this.fecha.getTime() <= fechaReferencia.getTime()`.

---

### 4.5. `Mensaje` (`mensaje.js`)
- **Atributos**:
  - `id: Number (Int autoincremental: 1, 2, 3...)`
  - `usuario: Usuario`
  - `mensaje: String`
  - `enviado: Date` (default `new Date()`)
- **Invariantes de Constructor**:
  - Si `!usuario` → `DomainValidationError("El usuario emisor del mensaje es obligatorio")`.
  - Si `!mensaje || typeof mensaje !== "string" || !mensaje.trim()` → `DomainValidationError("El contenido del mensaje no puede estar vacío")`.

---

### 4.6. `CambioEstadoCompra` (`cambioEstadoCompra.js`)
- **Atributos**:
  - `id: Number (Int autoincremental: 1, 2, 3...)`
  - `compra: Compra`
  - `estado: EstadoCompra`
  - `quien: Usuario`
  - `fechaHora: Date` (default `new Date()`)
- **Invariantes de Constructor**:
  - `compra`, `estado` (válido en `EstadoCompra`) y `quien` son obligatorios; de lo contrario lanza `DomainValidationError`.

---

### 4.7. `Compra` (`compra.js`)
- **Atributos**:
  - `id: Number (Int autoincremental: 1, 2, 3...)`
  - `comprador: Usuario`
  - `evento: Evento`
  - `tipoEntrada: TipoEntrada`
  - `cantidad: Number (Int)`
  - `total: Number (Double)` (calculado como `tipoEntrada.precio * cantidad` si no se provee)
  - `estado: EstadoCompra` (default `EstadoCompra.CONFIRMADA`)
  - `mensajes: Mensaje[]` (default `[]`)
  - `cambiosEstado: CambioEstadoCompra[]` (historial de trazabilidad)
- **Invariantes de Constructor**:
  - `comprador`, `evento` y `tipoEntrada` obligatorios.
  - `!Number.isInteger(cantidad) || cantidad <= 0` → `DomainValidationError("La cantidad de entradas debe ser un entero mayor a 0")`.
  - `estado` debe pertenecer a `EstadoCompra`.
- **Métodos de Dominio**:
  - **`actualizarEstado(nuevoEstado: EstadoCompra, quien = this.comprador, fechaHora = new Date()): void`** *(Método del Diagrama)*:
    - Valida transición según `specs/domain/02-maquina-estados-compra.md`.
    - Actualiza `this.estado = nuevoEstado` y agrega un nuevo `CambioEstadoCompra` a `this.cambiosEstado`.
  - **`cancelar(quien = this.comprador, fechaActual = new Date()): void`**:
    - Implementa los Casos de Uso 7 y 8: verifica que `this.estado !== EstadoCompra.UTILIZADA`, que no esté ya `CANCELADA`/`REEMBOLSADA`, y que `!this.evento.yaOcurrio(fechaActual)`.
    - Transiciona a `CANCELADA` y, si correspondía a una compra `CONFIRMADA`, a `REEMBOLSADA`, restituyendo el cupo en `this.tipoEntrada`.
  - **`agregarMensaje(usuario: Usuario, texto: String, enviado = new Date()): Mensaje`**:
    - Verifica que `usuario.id === this.comprador.id || usuario.id === this.evento.organizador.id`. Si es otro usuario, lanza `DomainValidationError("Solo el comprador o el organizador del evento pueden enviar mensajes en esta compra")`.
    - Crea `new Mensaje({ usuario, mensaje: texto, enviado })`, lo añade a `this.mensajes` y lo retorna.
  - **`calcularDiasParaEvento(fechaReferencia = new Date()): Number | null`**:
    - Si `this.estado !== EstadoCompra.CONFIRMADA` retorna `null` (Caso de Uso 1).
    - Si está `CONFIRMADA`, retorna `Math.max(0, Math.ceil((this.evento.fecha.getTime() - fechaReferencia.getTime()) / 86400000))`.

---

### 4.8. `Resenia` (`resenia.js`)
- **Atributos**:
  - `id: Number (Int autoincremental: 1, 2, 3...)`
  - `comprador: Usuario`
  - `evento: Evento`
  - `detalle: String`
  - `puntuacion: Number (Double)`
- **Invariantes de Constructor**:
  - `comprador` y `evento` obligatorios.
  - `detalle` obligatorio y no vacío (`DomainValidationError("El comentario de la reseña es obligatorio")`).
  - `typeof puntuacion !== "number" || Number.isNaN(puntuacion) || puntuacion < 1 || puntuacion > 5` → `DomainValidationError("La puntuación debe ser un número entre 1 y 5")`.
  - *Bordes Stryker*: probar `puntuacion = 1`, `puntuacion = 5`, `puntuacion = 0.9`, `puntuacion = 5.1`, `puntuacion = NaN`.

