---
name: react-native-mobile-ui
description: >-
  Use this skill when building or modifying React Native screens, components,
  navigation, state context, or API client services in the frontend/ directory.
---

# React Native Mobile UI Skill (`frontend/`)

Esta skill guía el desarrollo del módulo Front-End en **React Native (Expo)** para **AI Ticket It**, siguiendo el modelo unificado definido en `specs/ui/01-pantallas-y-navegacion-mobile.md` y `docs/adr/004-disenio-frontend-mensajeria-y-filtros.md`.

---

## 1. Principios de Diseño Mobile para el TP

1. **Navegación Unificada (5 Pestañas + Acceso Superior `Mis Eventos`)**:
   - Barra inferior fija con 5 pestañas de izquierda a derecha:
     - **`Inicio`**: Catálogo de eventos futuros (`soloFuturos=true` por defecto) en tarjetas de ancho completo, búsqueda por texto, chips de categorías y modal de **Filtros** (orden por fecha/precio/puntaje del organizador + rango de precios).
     - **`Favoritos`**: Eventos guardados del usuario autenticado.
     - **`Mis Compras`** *(o **`Mis Eventos`** si está activa la preferencia "Elegir 'Mis Eventos' como vista predeterminada")*: en modo estándar muestra compras con filtro `Todos / Futuros`, filtros por los 5 `EstadoCompra`, indicador `"Hoy! 🥳"` o días restantes si está `CONFIRMADA`, botón **"Seguimiento de la compra"**, cancelar, calificar (si `UTILIZADA`) y chat. Cuando se activa `Mis Eventos` como predeterminada, intercambia su lugar con el botón superior derecho (`Mis Eventos` en la 3ª pestaña y apertura inicial si hay sesión, `Mis Compras` arriba a la derecha).
     - **`Mensajes`**: Bandeja estilo WhatsApp unificada (`GET /api/mensajes/conversaciones`) con polling cada 10s (pausado en background), puntito rojo para mensajes no leídos, y envío de texto más adjuntos de comprobante (imagen o PDF en base64).
     - **`Perfil`**: Login/Registro estándar para invitados; datos de usuario y **`Opciones -> Tema y accesibilidad`** (tema Claro/Oscuro, switch Modo Daltónico Okabe-Ito, switch Elegir "Mis Eventos" como vista predeterminada y switch para mostrar/ocultar el botón `Mis Eventos`).
   - Botón **`Mis Eventos`** (icono de calendario) arriba a la derecha (ocultable desde `Perfil -> Opciones`): estado vacío informativo si el usuario aún no creó eventos, publicación con selector nativo de fecha y carga desde galería (`+`), y gestión de eventos con disponibilidad por `TipoEntrada`, filtro por estado de compra y acciones individuales o por lote respetando las transiciones válidas.
2. **Conexión Local con el Back-End (`src/services/api.js`)**:
   - Centralizar la URL base (`API_BASE_URL`) detectando automáticamente el host de desarrollo de Expo/emulador (`10.0.2.2` en emulador Android, `localhost` en iOS/Web, o IP LAN en dispositivo físico).
3. **Temas y Accesibilidad (`src/theme/`)**:
   - Mantener tokens centralizados para Tema Claro (Paleta Regal Navy `#0D3B66`, Lemon Chiffon `#FAF0CA`, Tomato `#F95738`), Tema Oscuro (Shadow Grey `#1D1E2C`, Grape Soda `#9C528B`) y Modo Daltónico (Okabe-Ito + iconos diferenciados en todos los badges de estado).
