# Especificación de API REST 01: Contratos del Back-End (`backend/`)

## 1. Resumen de Endpoints

| Método | Ruta | Descripción | Casos de Uso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Estado de salud del servidor en memoria | Infraestructura |
| `GET` | `/api/usuarios` | Lista de usuarios precargados (para el selector Comprador/Organizador) | Soporte Demo / Roles |
| `GET` | `/api/usuarios/:id` | Detalle de un usuario y sus eventos favoritos | Favoritos |
| `POST` | `/api/usuarios/:id/favoritos` | Agregar o quitar un evento de favoritos (`{ eventoId }`) | Contexto General |
| `GET` | `/api/categorias` | Lista todas las categorías de eventos disponibles | CU 3 |
| `GET` | `/api/eventos` | Buscar, filtrar (texto, categoría, rango precio) y ordenar eventos (`precio`, `fecha`, `puntaje`) | CU 3, CU 10, CU 11 |
| `GET` | `/api/eventos/:id` | Detalle completo del evento, disponibilidad por `TipoEntrada`, puntaje y reseñas del organizador | CU 2, CU 10, CU 12 |
| `POST` | `/api/eventos` | Crear un nuevo evento con sus distintos `TipoEntrada` (precio y cupo) | CU 4 |
| `GET` | `/api/eventos/:id/compras` | Listar todas las compras asociadas a un evento y el cupo remanente de cada tipo | CU 2 |
| `POST` | `/api/compras` | Realizar una compra sobre un evento validando cupo disponible | CU 12 |
| `GET` | `/api/compras` | Listar compras filtradas por `compradorId` o `eventoId` (incluye `diasParaEvento` si `CONFIRMADA`) | CU 1, CU 2 |
| `GET` | `/api/compras/:id` | Detalle de una compra con su historial de `cambiosEstado` y `mensajes` | CU 1, CU 5, CU 6 |
| `PATCH` | `/api/compras/:id/estado` | Actualizar estado de compra (ej. confirmar o marcar como `UTILIZADA`) | CU 1, CU 9 |
| `POST` | `/api/compras/:id/cancelar` | Cancelar una compra (reembolsando y restituyendo cupo si no está `UTILIZADA` y el evento no ocurrió) | CU 7, CU 8 |
| `POST` | `/api/compras/:id/mensajes` | Enviar o responder un mensaje en el chat de la compra | CU 5, CU 6 |
| `POST` | `/api/resenias` | Calificar un evento (puntaje 1..5 y comentario) habiendo utilizado una entrada | CU 9 |
| `GET` | `/api/organizadores/:id/resenias` | Obtener todas las reseñas de los eventos de un organizador y su promedio | CU 10, CU 11 |

---

## 2. Detalle de Contratos Principales

### 2.1. `GET /api/eventos` (Búsqueda, Filtros y Ordenamiento — CU 3 y CU 11)
- **Query Params (opcionales)**:
  - `q`: string (búsqueda textual case-insensitive sobre `nombre` y `descripcion`).
  - `categoriaId`: string (filtra por `evento.categoria.id`).
  - `organizadorId`: string (filtra eventos de un organizador).
  - `precioMin`, `precioMax`: números enteros/decimales (usa `evento.tuPrecioEstaEntre(min, max)`).
  - `ordenarPor`: `"precio"` | `"fecha"` | `"puntaje"` (default `"fecha"`).
  - `orden`: `"asc"` | `"desc"` (default `"asc"` para precio/fecha, `"desc"` para puntaje).
- **Respuesta `200 OK`**:
  - Lista de eventos enriquecida con `precioMinimo`, `puntajeOrganizador` y `cantidadReseniasOrganizador`.

### 2.2. `POST /api/eventos` (Crear Evento con Tipos de Entrada — CU 4)
- **Body (validado con Zod)**:
  ```json
  {
    "nombre": "Festival Rock en Vivo",
    "descripcion": "Bandas nacionales en vivo",
    "categoriaId": 1,
    "organizadorId": 1,
    "fecha": "2026-12-15T21:00:00.000Z",
    "multimedia": ["https://..."],
    "tiposEntrada": [
      { "nombre": "General", "descripcion": "Campo de pie", "precio": 15000, "cupo": 200 },
      { "nombre": "VIP", "descripcion": "Sector preferencial", "precio": 35000, "cupo": 50 }
    ]
  }
  ```
- **Respuesta**: `201 Created` con el evento creado.
- **Errores**: `400 Bad Request` si faltan datos, precios/cupos inválidos o `tiposEntrada` vacío; `404 Not Found` si no existe la categoría o el organizador.

### 2.3. `POST /api/compras` (Comprar Entradas validando Cupo — CU 12)
- **Body**:
  ```json
  {
    "compradorId": 2,
    "eventoId": 1,
    "tipoEntradaId": 1,
    "cantidad": 2
  }
  ```
- **Lógica**:
  1. Verifica existencia de `comprador`, `evento` y `tipoEntrada` dentro del evento.
  2. Verifica `tipoEntrada.hayCupoPara(cantidad)`. Si no alcanza, responde `400 Bad Request` (o `409 Conflict`).
  3. Descuenta el cupo con `tipoEntrada.descontarCupo(cantidad)`.
  4. Crea la `Compra` en estado `CONFIRMADA` con su `CambioEstadoCompra` inicial.
- **Respuesta**: `201 Created` incluyendo `diasParaEvento`.

### 2.4. `POST /api/compras/:id/cancelar` (Cancelar Compra y Reembolso — CU 7 y CU 8)
- **Body**:
  ```json
  {
    "usuarioId": 2
  }
  ```
- **Lógica**:
  1. Si la compra está en estado `UTILIZADA` o ya fue `CANCELADA`/`REEMBOLSADA` → `409 Conflict` (`InvalidStateTransitionError`).
  2. Si el evento ya se realizó (`evento.fecha <= ahora`) → `400 Bad Request` (`DomainValidationError`).
  3. Transiciona la compra a `CANCELADA` y `REEMBOLSADA`, restituyendo `compra.cantidad` al `cupo` del `TipoEntrada`.
- **Respuesta**: `200 OK` con la compra actualizada y el nuevo historial `cambiosEstado`.

### 2.5. `POST /api/compras/:id/mensajes` (Chat de Compra — CU 5 y CU 6)
- **Body**:
  ```json
  {
    "usuarioId": 2,
    "mensaje": "Hola, ¿a qué hora abren las puertas?"
  }
  ```
- **Respuesta**: `201 Created` con el mensaje creado y la compra actualizada.

### 2.6. `POST /api/resenias` (Calificar Evento — CU 9 y CU 10)
- **Body**:
  ```json
  {
    "compradorId": 2,
    "eventoId": 1,
    "puntuacion": 5,
    "detalle": "Excelente organización y sonido impecable"
  }
  ```
- **Lógica**:
  1. Verifica que el comprador tenga al menos una `Compra` para `eventoId` con `estado === "UTILIZADA"`. Si no la tiene → `400 Bad Request` (`BusinessRuleError`).
  2. Verifica que el comprador no haya calificado previamente ese mismo evento → `409 Conflict`.
  3. Crea la `Resenia` validando `puntuacion` entre `1` y `5` y `detalle` no vacío.
- **Respuesta**: `201 Created`.

