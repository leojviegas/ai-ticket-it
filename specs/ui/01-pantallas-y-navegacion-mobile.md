# Especificación de UI Mobile 01: Pantallas, Componentes y Navegación (`frontend/`)

## 1. Experiencia Unificada, Acceso e Identidad Visual

Dado que en el modelo de dominio existe una única entidad `Usuario` y cualquier persona puede tanto comprar entradas para asistir a espectáculos como publicar y gestionar sus propios eventos, la aplicación ofrece **una única interfaz unificada para todos los usuarios**, iniciando en modo **invitado primero** directamente sobre el catálogo `Inicio`.

### 1.1. Navegación Principal (5 Pestañas Inferiores + Acceso Superior `Mis Eventos`)

Barra inferior (`Bottom Tabs`) de izquierda a derecha:

1. **`Inicio`**:
   - Catálogo de eventos futuros (`soloFuturos=true` por defecto) en formato de **tarjetas de ancho completo**.
2. **`Favoritos`**:
   - Eventos marcados como favoritos por el usuario autenticado. Si es invitado, solicita iniciar sesión.
3. **`Mis Compras`** *(o **`Mis Eventos`** si el usuario activó "Elegir Mis Eventos como vista predeterminada")*:
   - En el modo estándar, lista las compras realizadas por el usuario, con filtro `Todos / Futuros`, filtros por los 5 `EstadoCompra`, contador de días restantes (mostrando `"Hoy! 🥳"` cuando el evento ocurre en el día), botón de cancelar, acceso a **"Seguimiento de la compra"**, botón de chat y botón de calificar cuando está `UTILIZADA`.
   - Si está activada la opción **"Elegir 'Mis Eventos' como vista predeterminada"**, esta tercera pestaña inferior pasa a ser **`Mis Eventos`** (icono calendario) y **`Mis Compras`** (icono ticket) pasa al botón superior derecho.
4. **`Mensajes`**:
   - Bandeja de mensajería interna estilo WhatsApp que unifica todas las conversaciones del usuario (como comprador y como organizador) mediante `GET /api/mensajes/conversaciones`, con **polling cada 10 segundos** (pausado cuando la app pasa a segundo plano) y un **puntito rojo** en el icono cuando existen mensajes nuevos sin leer (desaparece al ingresar a la sección).
5. **`Perfil`**:
   - Para invitado: pantalla estándar de **Login / Registro** (email y contraseña, sin botones de acceso rápido demo).
   - Para usuario autenticado: datos de la cuenta, cerrar sesión y acceso a **`Opciones -> Tema y accesibilidad`**.

**Botón Superior Derecho (`Mis Eventos` o `Mis Compras`)**:
- En el modo estándar muestra **`Mis Eventos`** (icono de calendario), ocultable/mostrable desde `Perfil -> Opciones -> Tema y accesibilidad`.
- Si el usuario activó **"Elegir 'Mis Eventos' como vista predeterminada"** en `Opciones`:
  - El botón superior derecho pasa a mostrar **`Mis Compras`** (icono de ticket, siempre visible para conservar acceso a las entradas compradas), mientras `Mis Eventos` ocupa la 3ª pestaña de la barra inferior.
  - Si hay sesión autenticada al abrir la app, navega directamente a `Mis Eventos` como vista inicial (en modo invitado sigue abriendo en `Inicio`).
- Al entrar a `Mis Eventos`: si el usuario es invitado redirige a Login; si está autenticado y aún no organizó eventos muestra un estado vacío informativo invitando a crear el primero (con aviso aclarando que puede deshabilitar el botón en `Perfil` si no planea organizar); si ya tiene eventos publicados abre el listado de gestión.

### 1.2. Paletas, Temas y Accesibilidad

- **Tema Claro (predeterminado por accesibilidad)**:
  - Primario de marca: `#0D3B66` (Regal Navy)
  - Fondo suave / Superficie destacada: `#FAF0CA` (Lemon Chiffon) sobre base `#FFFDF7` / `#FFFFFF`
  - Acento secundario / Estrellas: `#F4D35E` (Royal Gold) y `#EE964B` (Sandy Brown)
  - Acento acción / Destacado: `#F95738` (Tomato)
- **Tema Oscuro**:
  - Base: `#1D1E2C` (Shadow Grey), tarjetas `#27293B`
  - Bordes / Inactivos: `#59656F` (Blue Slate)
  - Acento de marca: `#9C528B` (Grape Soda)
  - Textos: `#FFFFFF` (principal) y `#D7CDCC` (Dust Grey, secundario)
- **Modo Daltónico (`Perfil -> Opciones -> Tema y accesibilidad`)**:
  - Switch específico que activa la paleta **Okabe-Ito** (`#0072B2` azul, `#E69F00` ámbar, `#56B4E9` celeste, `#D55E00` bermellón, `#CC79A7` púrpura) combinada con **doble codificación** permanente (icono distinto + texto + borde reforzado en cada `EstadoCompra` y alerta).

---

## 2. Detalle de Pantallas Clave

### 2.1. `InicioScreen` (CU 3, CU 11)
- **Controles visibles**:
  - `SearchBar`: búsqueda textual (`q`) por nombre o descripción.
  - `CategoryChips`: filtro horizontal por categorías (`categoriaId`).
  - Botón **`Filtros`**: abre un modal/bottom sheet con selector de ordenamiento (`Fecha`, `Precio` mínimo, `Puntaje del Organizador`) y rango de precios (`precioMin` / `precioMax`).
- **Listado (`EventCard` ancho completo)**:
  - Carga por defecto únicamente eventos futuros (`soloFuturos=true`). Muestra imagen superior, categoría, fecha, título, precio *"Desde $..."*, organizador con su puntaje promedio y botón de favorito.

### 2.2. `EventoDetalleScreen` (CU 10, CU 12)
- **Secciones**:
  1. Cabecera visual (`multimedia`), nombre, categoría, fecha y descripción.
  2. **Tarjeta del Organizador (clickeable -> `PerfilOrganizadorScreen`)**: muestra nombre, puntaje promedio global y un preview desplegable con reseñas de eventos anteriores (`reseniasEventosAnterioresOrganizador` — CU 10). Si el evento ya tiene reseñas propias (`reseniasEvento`), se muestran en su sección dentro de la pantalla.
  3. **Aviso de propio organizador**: si el usuario autenticado es el organizador del evento, muestra un banner amigable (*"Sos el organizador de este evento, muchos éxitos con la gestión"*) y reemplaza la barra de compra por el botón **"Gestionar evento"** (navega a `GestionEventoScreen`).
  4. **Selección de Entradas (`TipoEntrada`)**: lista cada tipo de entrada con descripción, precio y cupo disponible. Incluye selector `- cantidad +` donde **al estar en cantidad `1`, el botón `-` se transforma en un icono de tacho de basura** que al presionarse des-selecciona el tipo de entrada (`0`).
  5. **Evento ya realizado**: si `yaOcurrio === true`, el botón **Comprar** permanece deshabilitado indicando que el evento ya finalizó (respaldado por validación en backend).

### 2.3. `PerfilOrganizadorScreen` (CU 10)
- Muestra el nombre completo del organizador, su **puntaje promedio global** y cantidad total de reseñas.
- Debajo lista **todos sus eventos** (pasados y futuros, sin el filtro `soloFuturos`) mostrando junto a cada ítem el puntaje individual del evento (`puntajeEvento`) para compararlos de un golpe de vista. Al tocar un evento, navega a `EventoDetalleScreen` donde se listan las reseñas de ese evento.

### 2.4. `MisComprasScreen` y `CompraDetalleScreen` (CU 1, CU 5, CU 7, CU 8, CU 9)
- **Filtros en `MisComprasScreen`**:
  1. Primer selector segmentado: **`Todos`** | **`Futuros`** (envía `soloFuturos=true` a `GET /api/compras`).
  2. Segunda fila de chips por estado: `Todos` + los 5 `EstadoCompra` (`PENDIENTE`, `CONFIRMADA`, `UTILIZADA`, `CANCELADA`, `REEMBOLSADA`), enviando `estado` a `GET /api/compras`.
- **Tarjetas y Detalle de Compra**:
  - Badge semántico con icono + texto según `EstadoCompra`:
    - `PENDIENTE` (Ámbar + reloj): esperando confirmación del organizador.
    - `CONFIRMADA` (Verde / Azul Okabe-Ito + tilde): si `evento.fecha` es hoy muestra **"Hoy! 🥳"**; si es posterior, **"Faltan X días para el evento"** (CU 1).
    - `UTILIZADA` (Azul / Celeste + ticket): habilita **"Calificar evento"** (CU 9) si `!yaReseniado`.
    - `CANCELADA` (Rojo / Bermellón + cruz): pendiente de reembolso por el organizador.
    - `REEMBOLSADA` (Violeta / Púrpura + devolución): reembolso acreditado.
  - Botón **"Seguimiento de la compra"**: abre la vista/modal con todo el historial de `cambiosEstado`, mostrando fecha/hora, estado alcanzado y el campo **"¿Quién inició el cambio?"** (`Usuario` u `Organizador`).
  - Botón **"Cancelar compra"**: habilitado si `estado` es `PENDIENTE` o `CONFIRMADA` y el evento no ocurrió (CU 7, CU 8).
  - Botón **"Chat con el organizador"**: abre o continúa la conversación en la pantalla de chat de esa compra (CU 5).

### 2.5. `MensajesScreen` y `ConversacionScreen` (CU 5, CU 6)
- **`MensajesScreen` (Bandeja estilo WhatsApp)**:
  - Lista todas las conversaciones obtenidas de `GET /api/mensajes/conversaciones`, indicando rol (`Comprador` / `Organizador`), evento, contraparte, estado de la compra, último mensaje/adjunto y fecha.
  - Al ingresar a esta sección se limpia el indicador de **puntito rojo** en el icono de `Mensajes` (estado persistido en `AsyncStorage`).
  - *(Última prioridad)*: acción local para ocultar/eliminar una conversación de la bandeja del usuario en `AsyncStorage` sin borrarla del servidor (vuelve a mostrarse si llega un mensaje nuevo).
- **`ConversacionScreen` (Chat de Compra)**:
  - Banner superior con nombre del evento, contraparte y estado de la compra; al tocarlo redirige a `GestionEventoScreen` si el usuario autenticado es el organizador del evento (atajo directo para gestionar la compra), o a `EventoDetalleScreen` si es el comprador.
  - Burbujas diferenciadas para mensajes propios (`remitente.id === usuario.id`) y recibidos.
  - Polling automático cada **10 segundos** mientras la pantalla está activa.
  - **Adjuntar comprobante**: botón para enviar texto y/o adjuntar una **imagen** (`expo-image-picker`: JPG, PNG, WEBP) o un **PDF** (`expo-document-picker`) codificado en Data URI base64 mediante `POST /api/compras/:id/mensajes`, con previsualización/descarga en la burbuja.

### 2.6. `MisEventosScreen`, `CrearEventoScreen` y `GestionEventoScreen` (CU 2, CU 4, CU 6, CU 7, CU 8)
- **Estado vacío (`MisEventosScreen` sin eventos creados)**:
  - Mensaje informativo invitando a publicar el primer evento con botón directo a `CrearEventoScreen`, más un cartel secundario aclarando que si no planea organizar eventos puede deshabilitar el botón `Mis Eventos` desde `Perfil -> Opciones`.
- **Crear Evento (`CrearEventoScreen` — CU 4)**:
  - Nombre, descripción, selector de categoría.
  - **Fecha y hora**: selector nativo accesible de fecha y hora (`@react-native-community/datetimepicker`).
  - **Multimedia**: selector visual con botón **`+`** que abre la galería del dispositivo (`expo-image-picker`, formatos JPG/PNG) y muestra miniaturas con opción de quitar.
  - **Tipos de entrada**: constructor dinámico de `TipoEntrada` (nombre, descripción, precio, cupo).
- **Gestionar Evento (`GestionEventoScreen` — CU 2, CU 6)**:
  1. **Disponibilidad por `TipoEntrada`**: tarjetas mostrando `cupoDisponible`, `entradasVendidas` y `entradasReservadas`.
  2. **Filtro de compras por estado (`GET /api/eventos/:id/compras?estado=...`)**: permite filtrar por `Todas`, `PENDIENTE`, `CONFIRMADA`, `UTILIZADA`, `CANCELADA`, `REEMBOLSADA`.
  3. **Selección individual o múltiple + Barra de acciones**: cada compra puede seleccionarse para ejecutar transiciones válidas según la máquina de estados (por ejemplo confirmar compras `PENDIENTE`, cancelar compras `PENDIENTE` o `CONFIRMADA` mientras el evento no haya ocurrido, o reembolsar compras `CANCELADA`), además de botón directo para abrir el chat con el comprador. La transición `CONFIRMADA -> UTILIZADA` es automática al cumplirse la fecha del evento, sin botón manual.

### 2.7. `PerfilScreen` y `OpcionesScreen`
- **`PerfilScreen`**:
  - Si es invitado: formulario de Login y pestaña de Registro (email y contraseña).
  - Si está autenticado: tarjeta de perfil, acceso rápido a `Opciones` y botón de cerrar sesión.
- **`OpcionesScreen -> Tema y accesibilidad`**:
  - Selector **Tema**: `Claro` (predeterminado) | `Oscuro`.
  - Switch **Modo daltónico**: activa paleta Okabe-Ito y refuerzo visual en toda la app.
  - Switch **Elegir "Mis Eventos" como vista predeterminada**: pensado para organizadores; coloca `Mis Eventos` en la 3ª pestaña de la barra inferior en lugar de `Mis Compras`, mueve `Mis Compras` al botón superior derecho y abre la app en `Mis Eventos` cuando hay sesión iniciada.
  - Switch **Mostrar botón Mis Eventos**: habilita o deshabilita el botón de calendario arriba a la derecha (se deshabilita mientras "Mis Eventos" sea la vista predeterminada en la barra inferior), acompañado de texto descriptivo (*"Si no tenés planeado organizar eventos a futuro, para tu comodidad podés deshabilitar este botón de la interfaz principal"*).
