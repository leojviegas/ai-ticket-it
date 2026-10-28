# Especificación de UI Mobile 01: Pantallas, Componentes y Navegación (`frontend/`)

## 1. Estructura General de la Interfaz (React Native)

Para facilitar tanto el uso real como la grabación del **video de demostración de 5 a 10 minutos**, la aplicación mobile incluye:

1. **Barra Superior de Contexto (`UserRoleSwitcher`)**:
   - Muestra el usuario activo (ej. *"Comprador: Sofía Martínez"* o *"Organizador: Productora Indie Live"*) y permite cambiar de usuario/rol con un toque.
2. **Navegación por Pestañas Según Rol Activo**:
   - **Modo Comprador**:
     1. `Explorar Eventos` (Búsqueda textual, filtros por `Categoria`, ordenamiento por `Precio`, `Fecha`, `Puntaje Organizador`).
     2. `Mis Compras` (Listado de compras con badge de `EstadoCompra`, contador de **días faltantes** si está `CONFIRMADA`, acceso al **Chat**, **Cancelar/Reembolsar** y **Calificar**).
     3. `Favoritos` (Eventos guardados por el comprador).
   - **Modo Organizador**:
     1. `Mis Eventos` (Eventos publicados por el organizador, resumen de ventas y cupos disponibles).
     2. `Crear Evento` (Formulario completo con carga dinámica de múltiples `TipoEntrada`).

---

## 2. Detalle de Pantallas Clave

### 2.1. `ExplorarEventosScreen` (Comprador — CU 3, CU 11)
- **Componentes**:
  - `SearchBar`: input de texto para buscar por nombre o descripción.
  - `CategoryChips`: carrusel horizontal de categorías (`Todas`, `Recitales`, `Teatro`, `Festivales`, `Conferencias`, `Deportes`).
  - `SortSelector`: botones para ordenar por **Fecha**, **Precio** o **Puntaje del Organizador**.
  - `EventCard`: muestra título, categoría, fecha, precio mínimo (*"Desde $..."*), nombre y estrellas de reputación del organizador, y botón de favorito.

### 2.2. `EventoDetalleScreen` (Comprador — CU 10, CU 12)
- **Secciones**:
  1. Cabecera del evento (nombre, descripción, categoría, fecha y galería multimedia).
  2. **Selector de Entradas (`TipoEntrada`)**: tarjetas para cada tipo de entrada (ej. General, Platea, VIP) mostrando descripción, precio y **cupo disponible**. Selector numérico de cantidad (`-` / `+`) bloqueado al máximo del cupo disponible y botón **"Comprar Entradas"**.
  3. **Reputación y Reseñas del Organizador (CU 10)**: muestra el puntaje promedio del organizador y la lista de reseñas de eventos anteriores organizados por él (autor, evento reseñado, puntaje numérico y comentario).

### 2.3. `MisComprasScreen` y `CompraDetalleChatScreen` (Comprador — CU 1, CU 5, CU 7, CU 9)
- **Tarjetas de Compra**:
  - Badge de estado con código de colores semántico:
    - `CONFIRMADA` (Verde) + **Banner destacado: "⏳ Faltan X días para el evento"** (CU 1).
    - `PENDIENTE` (Ámbar).
    - `UTILIZADA` (Azul) + Botón **"⭐ Calificar Evento"** (CU 9).
    - `CANCELADA` / `REEMBOLSADA` (Rojo / Gris) con indicador de reembolso efectuado.
  - Botón **"Cancelar y Solicitar Reembolso"**: visible/activo cuando `estado !== UTILIZADA` (y no cancelada) y el evento aún no se realizó (CU 7 y CU 8).
  - Botón **"💬 Chat con Organizador"**: abre el chat de la compra donde se visualizan los mensajes e historial de `CambioEstadoCompra` y se pueden enviar mensajes en cualquier momento (CU 5).

### 2.4. `OrganizadorEventoVentasScreen` (Organizador — CU 2, CU 6, CU 8, CU 9)
- **Secciones**:
  1. **Disponibilidad por Tipo de Entrada (CU 2)**: tarjetas que muestran para cada `TipoEntrada` su precio y **cuántas entradas quedan disponibles** (`cupo` remanente).
  2. **Compras Asociadas al Evento (CU 2)**: lista de compras recibidas con su estado, comprador, cantidad y monto total.
  3. **Acciones del Organizador por Compra**:
     - Abrir el **Chat de la Compra** y responder mensajes del comprador en cualquier momento (CU 6).
     - Marcar una compra `CONFIRMADA` como **`UTILIZADA`** (simulando el ingreso al evento para habilitar que el comprador deje su reseña en vivo).

### 2.5. `CrearEventoScreen` (Organizador — CU 4)
- Formulario intuitivo para cargar:
  - Nombre, descripción, categoría, fecha/hora del evento.
  - Lista dinámica de **Tipos de Entrada**: permite agregar tantos tipos de entrada como desee (ej. General, Platea, VIP), definiendo para cada uno `nombre`, `descripcion`, `precio` y `cupo`.

