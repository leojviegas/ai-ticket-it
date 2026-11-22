# Especificación de API REST 01: Contratos del Back-End (`backend/`)

## 1. Resumen de Endpoints

| Método | Ruta | Auth | Descripción | Casos de Uso |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Pública | Estado de salud del servidor en memoria | Infraestructura |
| `POST` | `/api/auth/register` | Pública | Registrar una cuenta de usuario (hashea contraseña con `bcryptjs` y devuelve `accessToken` JWT y usuario) | Cuentas / Sesión |
| `POST` | `/api/auth/login` | Pública | Iniciar sesión validando credenciales y devolviendo `accessToken` JWT y usuario | Cuentas / Sesión |
| `GET` | `/api/auth/me` | `Bearer` (`requireAuth`) | Obtener los datos actualizados del usuario autenticado y validar que la sesión siga vigente | Cuentas / Sesión |
| `GET` | `/api/usuarios` | Pública | Lista de usuarios precargados | Soporte Demo / Perfiles |
| `GET` | `/api/usuarios/:id` | Pública | Detalle de un usuario y sus eventos organizados/favoritos | Perfil / Favoritos |
| `POST` | `/api/usuarios/:id/favoritos` | `Bearer` (`requireAuth`) | Agregar o quitar un evento de favoritos (`{ eventoId }`, solo del propio usuario) | Contexto General |
| `GET` | `/api/categorias` | Pública | Lista todas las categorías de eventos disponibles | CU 3 |
| `GET` | `/api/eventos` | Pública | Buscar, filtrar (texto, categoría, rango precio, solo futuros) y ordenar eventos (`precio`, `fecha`, `puntaje`) | CU 3, CU 10, CU 11 |
| `GET` | `/api/eventos/:id` | Pública | Detalle completo del evento, disponibilidad por `TipoEntrada`, puntaje y reseñas del organizador | CU 2, CU 10, CU 12 |
| `POST` | `/api/eventos` | `Bearer` (`requireAuth`) | Crear un nuevo evento con sus distintos `TipoEntrada` (precio y cupo) | CU 4 |
| `GET` | `/api/eventos/:id/compras` | `Bearer` (`requireAuth`) | Listar compras asociadas a un evento (filtro opcional `estado`), `entradasVendidas`, `entradasReservadas` y cupo remanente (solo su organizador) | CU 2 |
| `POST` | `/api/compras` | `Bearer` (`requireAuth`) | Realizar una compra sobre un evento validando cupo disponible | CU 12 |
| `GET` | `/api/compras` | `Bearer` (`requireAuth`) | Listar compras del usuario autenticado (o de un evento si es su organizador), con filtros opcionales `estado` y `soloFuturos`, `diasParaEvento` si `CONFIRMADA` y `yaReseniado` | CU 1, CU 2 |
| `GET` | `/api/compras/:id` | `Bearer` (`requireAuth`) | Detalle de una compra con su historial de `cambiosEstado`, `mensajes` y `yaReseniado` (solo comprador u organizador) | CU 1, CU 5, CU 6 |
| `PATCH` | `/api/compras/:id/estado` | `Bearer` (`requireAuth`) | Actualizar estado de compra (`CONFIRMADA`, `REEMBOLSADA`) por parte del organizador (el paso a `UTILIZADA` es automático al cumplirse la fecha del evento) | CU 1, CU 7 |
| `POST` | `/api/compras/:id/cancelar` | `Bearer` (`requireAuth`) | Cancelar una compra `PENDIENTE` o `CONFIRMADA` por parte del comprador u organizador (pasa a `CANCELADA` y restituye cupo si el evento no ocurrió) | CU 7, CU 8 |
| `POST` | `/api/compras/:id/reembolsar` | `Bearer` (`requireAuth`) | Emitir reembolso por parte del organizador sobre una compra `CANCELADA` (pasa a `REEMBOLSADA`) | CU 7, CU 8 |
| `POST` | `/api/compras/:id/mensajes` | `Bearer` (`requireAuth`) | Enviar o responder un mensaje (texto y/o comprobante imagen/PDF) en el chat de la compra | CU 5, CU 6 |
| `GET` | `/api/mensajes` | `Bearer` (`requireAuth`) | Consultar mensajes del usuario autenticado por `compraId`, `conUsuarioId` (bidireccional), `remitenteId` o `destinatarioId` | CU 5, CU 6 |
| `GET` | `/api/mensajes/conversaciones` | `Bearer` (`requireAuth`) | Bandeja unificada de conversaciones por compra donde el usuario es comprador u organizador (`incluirVacias` opcional) | CU 5, CU 6 |
| `GET` | `/api/resenias` | Pública | Listar reseñas filtradas opcionalmente por `compradorId` o `eventoId` | CU 1, CU 9 |
| `POST` | `/api/resenias` | `Bearer` (`requireAuth`) | Calificar un evento (puntaje 1..5 y comentario) habiendo utilizado una entrada | CU 9 |
| `GET` | `/api/organizadores/:id/resenias` | Pública | Obtener todas las reseñas de los eventos de un organizador y su promedio | CU 10, CU 11 |

---

## 2. Detalle de Contratos Principales

### 2.1. `GET /api/eventos` (Búsqueda, Filtros y Ordenamiento — CU 3 y CU 11)
- **Query Params (opcionales)**:
  - `q`: string (búsqueda textual case-insensitive sobre `nombre` y `descripcion`).
  - `categoriaId`: string (filtra por `evento.categoria.id`).
  - `organizadorId`: string (filtra eventos de un organizador).
  - `precioMin`, `precioMax`: números enteros/decimales (usa `evento.tuPrecioEstaEntre(min, max)`; si ambos se informan, `precioMin <= precioMax`).
  - `soloFuturos`: booleano (`"true"` | `"false"`) para excluir eventos que ya ocurrieron.
  - `ordenarPor`: `"precio"` | `"fecha"` | `"puntaje"` (default `"fecha"`).
  - `orden`: `"asc"` | `"desc"` (default `"asc"` para precio/fecha, `"desc"` para puntaje).
- **Respuesta `200 OK`**:
  - Lista de eventos enriquecida con `precioMinimo`, `yaOcurrio`, `puntajeEvento`, `cantidadReseniasEvento`, `puntajeOrganizador` y `cantidadReseniasOrganizador`.

### 2.2. `POST /api/eventos` (Crear Evento con Tipos de Entrada — CU 4)
- **Body (validado con Zod)**:
  ```json
  {
    "nombre": "Festival Rock en Vivo",
    "descripcion": "Bandas nacionales en vivo",
    "categoriaId": 1,
    "organizadorId": 1,
    "fecha": "2026-12-15T21:00:00.000Z",
    "multimedia": ["https://...", "data:image/png;base64,..."],
    "tiposEntrada": [
      { "nombre": "General", "descripcion": "Campo de pie", "precio": 15000, "cupo": 200 },
      { "nombre": "VIP", "descripcion": "Sector preferencial", "precio": 35000, "cupo": 50 }
    ]
  }
  ```
- **Notas**: `multimedia` admite URLs `http(s)` o Data URIs base64 de imagen (`image/jpeg`, `image/jpg`, `image/png`, `image/webp`) con límite global de payload JSON de `10mb`.
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
  2. Si `comprador.id === evento.organizador.id` → `400 Bad Request` (`BusinessRuleError`).
  3. Si el evento ya se realizó (`evento.yaOcurrio()`) → `400 Bad Request` (`BusinessRuleError`).
  4. Verifica `tipoEntrada.hayCupoPara(cantidad)`. Si no alcanza, responde `400 Bad Request` (o `409 Conflict`).
  5. Descuenta el cupo con `tipoEntrada.descontarCupo(cantidad)`.
  6. Crea la `Compra` en estado **`PENDIENTE`** con su `CambioEstadoCompra` inicial (luego el organizador la confirma para pasarla a `CONFIRMADA`).
- **Respuesta**: `201 Created`.

### 2.4. `PATCH /api/compras/:id/estado`, `POST /api/compras/:id/cancelar` y `POST /api/compras/:id/reembolsar` (CU 7 y CU 8)
- **Actualizar Estado (`PATCH /api/compras/:id/estado`)**:
  - Acepta `{ "estado": "CONFIRMADA" | "REEMBOLSADA" }` por parte del organizador del evento.
  - La transición `CONFIRMADA -> UTILIZADA` es automática cuando `evento.fecha <= ahora` (sincronizada al consultar compras); intentar enviar `UTILIZADA` o `CANCELADA` manualmente responde `400 Bad Request` (`BusinessRuleError`).
- **Cancelar (`POST /api/compras/:id/cancelar`)**:
  - **Body**: `{ "usuarioId": 2 }` (opcional si se infiere de `req.user` Bearer; habilitado para comprador u organizador en compras `PENDIENTE` o `CONFIRMADA`).
  - **Lógica**:
    1. Si la compra está en estado `UTILIZADA` o ya fue `CANCELADA`/`REEMBOLSADA` → `409 Conflict` (`InvalidStateTransitionError`).
    2. Si el evento ya se realizó (`evento.fecha <= ahora`) → `400 Bad Request` (`DomainValidationError`).
    3. Transiciona la compra a **`CANCELADA`**, restituyendo `compra.cantidad` al `cupo` del `TipoEntrada`.
- **Reembolsar (`POST /api/compras/:id/reembolsar`)**:
  - **Body**: `{ "usuarioId": 1 }` (organizador del evento)
  - **Lógica**:
    1. Verifica que la compra se encuentre en estado **`CANCELADA`**. Si no lo está → `409 Conflict` (`InvalidStateTransitionError`).
    2. Transiciona la compra de `CANCELADA` a **`REEMBOLSADA`**, registrando el nuevo `CambioEstadoCompra`.
- **Respuesta**: `200 OK` con la compra actualizada y el historial `cambiosEstado`.

### 2.5. `POST /api/compras/:id/mensajes` (Chat de Compra — CU 5 y CU 6)
- **Body** (requiere `mensaje` no vacío, `adjunto` válido, o ambos):
  ```json
  {
    "mensaje": "Hola, ¿a qué hora abren las puertas?",
    "adjunto": {
      "nombre": "comprobante.pdf",
      "tipoMime": "application/pdf",
      "contenido": "data:application/pdf;base64,JVBERi0..."
    }
  }
  ```
  - Tipos MIME permitidos para `adjunto`: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
- **Respuesta**: `201 Created` con el mensaje creado (`id`, `remitente`, `destinatario`, `mensaje`, `enviado`, `adjunto`) y la compra actualizada.

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

### 2.7. `GET /api/compras` y `GET /api/eventos/:id/compras` (Filtros — CU 1 y CU 2)
- **`GET /api/compras`**: acepta query params opcionales `compradorId`, `eventoId`, `estado` (`PENDIENTE | CONFIRMADA | UTILIZADA | CANCELADA | REEMBOLSADA`) y `soloFuturos` (`true | false`).
- **`GET /api/eventos/:id/compras`**: acepta `organizadorId` y `estado` opcional. El filtro `estado` aplica solo sobre la lista `compras` retornada; `disponibilidadPorTipo` (`cupoDisponible`, `entradasVendidas`, `entradasReservadas`) siempre se calcula sobre la totalidad de las compras del evento.

### 2.8. `GET /api/mensajes` y `GET /api/mensajes/conversaciones` (Mensajería Interna — CU 5 y CU 6)
- **`GET /api/mensajes`** (Requiere `Bearer`):
  - **Query Params (opcionales)**: `compraId`, `conUsuarioId` (filtro bidireccional entre el usuario autenticado y la contraparte, devolviendo tanto los mensajes enviados como los recibidos), `remitenteId`, `destinatarioId`.
  - **Seguridad**: devuelve `403 Forbidden` si el usuario no participa en `compraId` o intenta consultar mensajes entre dos terceros (`remitenteId` y `destinatarioId` ajenos).
- **`GET /api/mensajes/conversaciones`** (Requiere `Bearer`):
  - **Query Params (opcionales)**: `incluirVacias` (`true | false`, default `false`).
  - **Respuesta `200 OK`**: lista de conversaciones agrupadas por compra donde el usuario autenticado es `COMPRADOR` u `ORGANIZADOR`, ordenadas por fecha del `ultimoMensaje` descendente. Incluye `compraId`, `eventoId`, `eventoNombre`, `eventoFecha`, `eventoMultimedia`, `estadoCompra`, `rolUsuario`, `contraparte`, `cantidadMensajes`, `ultimoMensaje` y `mensajes`.

