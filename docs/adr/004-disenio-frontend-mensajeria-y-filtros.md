# ADR 004: Diseño del Front-End Mobile, Sistema de Mensajería y Filtros

- **Estado**: Aceptado
- **Fecha**: 2026-11-22
- **Origen**: Definiciones de diseño UI/UX y alineación de contratos para el módulo `frontend/`

---

## Contexto

Al iniciar el diseño del módulo móvil en React Native (`frontend/`), fue necesario alinear la especificación de interfaz ([specs/ui/01-pantallas-y-navegacion-mobile.md](../../specs/ui/01-pantallas-y-navegacion-mobile.md)) con las capacidades reales del back-end autenticado con JWT y resolver aspectos de usabilidad, accesibilidad y mensajería interna:

1. La app debía permitir entrada directa en modo invitado (`Inicio`), acceso estándar con login/registro (sin botones demo rápidos) y un espacio dedicado para organizadores sin recargar la barra inferior de navegación.
2. Se requería soporte de temas Claro y Oscuro con paletas específicas más un modo daltónico accesible.
3. En el dominio, `Mensaje` modelaba únicamente `usuario`, lo que resultaba ambiguo para consultas bidireccionales entre comprador y organizador, y faltaban endpoints de bandeja de mensajes y filtros por `estado` y `soloFuturos` en compras y gestión de eventos.
4. En eventos y chats se requería soportar imágenes de galería (JPG/PNG) y comprobantes de pago (imagen o PDF) manteniendo la restricción innegociable de persistencia 100 % en memoria sin servicios de almacenamiento externo.

---

## Decisión

Se adoptaron las siguientes decisiones de diseño y arquitectura:

1. **Navegación Mobile y Acceso de Organizador (`Mis Eventos`)**:
   - **Acceso inicial invitado primero**: la app inicia directamente en `Inicio` permitiendo explorar eventos futuros y ver perfiles de organizadores; acciones autenticadas (comprar, favoritos, mis compras, mensajes, crear/gestionar eventos) solicitan iniciar sesión mediante una pantalla de Login/Registro estándar.
   - **Barra inferior de 5 pestañas**: `Inicio`, `Favoritos`, `Mis Compras` (o `Mis Eventos`), `Mensajes` y `Perfil`.
   - **Botón Superior Derecho e Intercambio Organizador (`defaultMyEventsView`)**: por defecto el botón superior derecho abre `Mis Eventos` (icono de calendario, ocultable desde `Perfil -> Opciones` y reemplazando definitivamente "Ticket Studio", con estado vacío informativo). Si el usuario activa en `Opciones` **"Elegir 'Mis Eventos' como vista predeterminada"**, `Mis Eventos` pasa a la 3ª pestaña inferior y abre como pantalla inicial al iniciar con sesión activa, mientras `Mis Compras` (icono ticket) pasa al botón superior derecho.

2. **Sistema de Diseño y Accesibilidad**:
   - **Tema Claro (predeterminado por accesibilidad)**: basado en Regal Navy (`#0D3B66` como color primario de marca), Lemon Chiffon (`#FAF0CA`), Royal Gold (`#F4D35E`), Sandy Brown (`#EE964B`) y Tomato (`#F95738`) sobre fondos claros de alto contraste.
   - **Tema Oscuro**: basado en Shadow Grey (`#1D1E2C`), superficie elevada, Blue Slate (`#59656F`), Grape Soda (`#9C528B`), Dust Grey (`#D7CDCC`) y White (`#FFFFFF`).
   - **Modo Daltónico**: switch dedicado en `Perfil -> Opciones -> Tema y accesibilidad` que aplica la paleta **Okabe-Ito** (`#0072B2`, `#E69F00`, `#56B4E9`, `#D55E00`, `#CC79A7`) para estados y alertas junto a **doble codificación obligatoria** (icono diferenciado + texto + borde reforzado en los 5 estados de compra).

3. **Evolución de `Mensaje`, Mensajería Interna y Polling**:
   - **Dominio (`Mensaje`)**: se reemplaza `usuario` por `remitente` y `destinatario` (deducido automáticamente en `Compra.agregarMensaje` entre `comprador` y `evento.organizador`), y se incorpora el atributo opcional `adjunto` (`{ nombre, tipoMime, contenido }` para imágenes JPG/PNG/WEBP o PDF en Data URI base64), permitiendo enviar texto, adjunto o ambos.
   - **Endpoints de mensajería**:
     - `GET /api/mensajes`: soporta `compraId`, `conUsuarioId` (filtro **bidireccional** que trae tanto mensajes enviados hacia `conUsuarioId` como recibidos desde `conUsuarioId`), `remitenteId` y `destinatarioId`, siempre restringido al usuario autenticado (`403 Forbidden` si se consultan compras o pares de terceros).
     - `GET /api/mensajes/conversaciones`: agrupa las compras con conversación donde el usuario participa como comprador u organizador, ordenadas por último mensaje (`?incluirVacias=true` opcional).
   - **Polling e indicador de no leídos**: el frontend realiza polling cada **10 segundos** (pausado automáticamente cuando la app pasa a segundo plano con `AppState`). El indicador visual (puntito rojo en el tab `Mensajes`) y el ocultamiento/borrado local de conversaciones (última prioridad del frontend) se persisten en el dispositivo mediante `AsyncStorage` sin complejizar el almacenamiento en memoria del servidor.

4. **Filtros Faltantes, Trazabilidad y Multimedia en Memoria**:
   - Se agregan los filtros `estado` y `soloFuturos` en `GET /api/compras`, y `estado` en `GET /api/eventos/:id/compras` (manteniendo el cálculo de `disponibilidadPorTipo` sobre la totalidad de las compras del evento).
   - El historial `cambiosEstado` se presenta en UI bajo el nombre **"Seguimiento de la compra"**, detallando fecha/hora, estado y **"¿Quién inició el cambio?"** (`Usuario` u `Organizador`).
   - El servidor Express eleva el límite de cuerpo JSON a `10mb` (`express.json({ limit: "10mb" })`) y valida en `crearEventoSchema` tanto URLs HTTP(S) como Data URIs base64 de imagen para permitir la selección directa desde la galería del celular (`expo-image-picker`) manteniendo la persistencia pura en RAM.

---

## Consecuencias

- **Positivas**:
  - Contratos REST explícitos y consistentes para mensajería bidireccional, bandeja unificada, filtros de comprador/organizador y carga de comprobantes/imágenes desde el dispositivo móvil.
  - Accesibilidad desde la base (tema claro por defecto, contraste verificado, soporte para daltonismo y date picker nativo).
  - Ninguna dependencia externa adicional para almacenamiento de archivos o tiempo real.
- **Compromisos**:
  - Al cambiar `usuario` por `remitente` y `destinatario` en `Mensaje`, los consumidores de la API deben leer `mensaje.remitente` y `mensaje.destinatario`.
  - Los archivos adjuntos y fotos de galería en base64 viven en memoria RAM mientras corre el proceso Node.js y deben mantenerse comprimidos en el cliente móvil para respetar el límite de 10 MB por request.
