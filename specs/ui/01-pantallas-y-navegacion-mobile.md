# Especificación de UI Mobile 01: Pantallas, Componentes y Navegación (`frontend/`)

## 1. Experiencia Unificada (Estilo YouTube / YouTube Studio)

Dado que en el modelo de dominio existe una única entidad `Usuario` y cualquier persona puede tanto comprar entradas para asistir a espectáculos como publicar y gestionar sus propios eventos, la aplicación ofrece **una única interfaz unificada para todos los usuarios**.

### Navegación Principal (Bottom Tabs)

1. **`Explorar` (Inicio / Catálogo)**:
   - Como el feed principal de YouTube: permite buscar eventos por texto, filtrar por `Categoria`, ordenar por `Precio`, `Fecha` o `Puntaje del Organizador`, guardar en favoritos y entrar al detalle de un evento para comprar entradas.
2. **`Mis Entradas` (Compras realizadas por el usuario)**:
   - Lista las compras que el usuario hizo para asistir a eventos, diferenciando con claridad cada `EstadoCompra` (`PENDIENTE`, `CONFIRMADA`, `UTILIZADA`, `CANCELADA`, `REEMBOLSADA`), mostrando los **días faltantes** cuando está `CONFIRMADA`, el acceso al **Chat de la compra**, el botón de **Cancelar compra** y el botón de **Calificar evento** (cuando está `UTILIZADA`).
3. **`Favoritos`**:
   - Acceso rápido a los eventos marcados como favoritos por el usuario.
4. **`Ticket Studio` (Centro de Productor / Organizador)**:
   - Inspirado en *YouTube Studio*: es el espacio donde cualquier usuario puede **Publicar un nuevo Evento** (definiendo sus distintos `TipoEntrada` con precio y cupo) y **Gestionar sus Eventos publicados** (ver cuántas entradas quedan disponibles de cada tipo, ver las compras recibidas, **Confirmar** compras pendientes, **Reembolsar** compras canceladas, marcar entradas como **Utilizadas** y **Responder mensajes** en el chat de cada compra).

---

## 2. Detalle de Pantallas Clave

### 2.1. `ExplorarEventosScreen` (CU 3, CU 11)
- **Componentes**:
  - `SearchBar`: búsqueda textual por nombre o descripción.
  - `CategoryChips`: filtro horizontal por categorías.
  - `SortSelector`: ordenamiento por **Fecha**, **Precio** (menor precio del evento) o **Puntaje del Organizador**.
  - `EventCard`: nombre del evento, categoría, fecha, precio *"Desde $..."*, nombre y reputación del organizador, y botón de favorito.

### 2.2. `EventoDetalleScreen` (CU 10, CU 12)
- **Secciones**:
  1. Información completa del evento (nombre, descripción, categoría, fecha, multimedia).
  2. **Selección de Entradas (`TipoEntrada`)**: muestra cada tipo de entrada con su descripción, precio y **cupo disponible**, selector de cantidad (sin superar el cupo) y botón **"Comprar"** (que crea la compra en estado `PENDIENTE`).
  3. **Reputación y Reseñas de Eventos Anteriores del Organizador (CU 10)**: muestra el puntaje del organizador y las reseñas que dejaron los asistentes en eventos previos organizados por ese mismo usuario.

### 2.3. `MisEntradasScreen` y `CompraDetalleChatScreen` (CU 1, CU 5, CU 7, CU 9)
- **Tarjetas de Compra**:
  - Badge semántico según `EstadoCompra`:
    - `PENDIENTE` (Ámbar): esperando confirmación del organizador.
    - `CONFIRMADA` (Verde): incluye indicador destacado **"⏳ Faltan X días para el evento"** (CU 1).
    - `UTILIZADA` (Azul): habilita el botón **"⭐ Calificar Evento"** (CU 9).
    - `CANCELADA` (Rojo): pendiente de reembolso por el organizador.
    - `REEMBOLSADA` (Gris/Violeta): reembolso acreditado por el organizador.
  - Botón **"Cancelar Compra"**: habilitado siempre que `estado !== UTILIZADA` (ni ya cancelada/reembolsada) y el evento aún no haya ocurrido (CU 7 y CU 8). Pasa la compra a `CANCELADA` y devuelve el cupo.
  - Botón **"💬 Chat de la Compra"**: permite enviar mensajes en cualquier momento al organizador (CU 5).

### 2.4. `TicketStudioScreen` y `GestionEventoScreen` (CU 2, CU 4, CU 6, CU 7, CU 8)
- **Publicar Evento (`CrearEventoModal` / `CrearEventoScreen` — CU 4)**:
  - Formulario para crear un `Evento` y agregar dinámicamente múltiples `TipoEntrada` (nombre, descripción, precio, cupo).
- **Detalle de Gestión de un Evento Publicado (`GestionEventoScreen` — CU 2, CU 6)**:
  1. **Disponibilidad de Entradas**: tarjetas por cada `TipoEntrada` mostrando el cupo remanente disponible y las entradas vendidas.
  2. **Listado de Compras del Evento**: muestra todas las compras asociadas diferenciando su estado y ofreciendo las acciones del organizador:
     - Si está `PENDIENTE` → botón **"Confirmar Compra"** (pasa a `CONFIRMADA`).
     - Si está `CONFIRMADA` → botón **"Marcar como Utilizada"** (pasa a `UTILIZADA`).
     - Si está `CANCELADA` → botón **"Reembolsar"** (pasa a `REEMBOLSADA`).
     - En cualquier estado → botón **"💬 Responder Chat"** (CU 6).
