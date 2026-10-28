---
name: react-native-mobile-ui
description: >-
  Use this skill when building or modifying React Native screens, components,
  navigation, state context, or API client services in the frontend/ directory.
---

# React Native Mobile UI Skill (`frontend/`)

Esta skill guía el desarrollo del módulo Front-End en **React Native** para **AI Ticket It**, asegurando una experiencia fluida tanto para el rol de **Comprador** como de **Organizador** y facilitando la demostración en el video de entrega.

---

## 1. Principios de Diseño Mobile para el TP

1. **Cambio Rápido de Usuario / Rol (`SessionContext`)**:
   - La aplicación debe contar con una barra o selector accesible en todo momento que permita alternar entre usuarios de prueba (ej. **Comprador** vs. **Organizador**) sin necesidad de cerrar sesión ni escribir credenciales.
   - Esto permite mostrar en vivo flujos bidireccionales (como el chat de una compra o la creación de un evento y su compra inmediata).
2. **Conexión Local con el Back-End (`src/services/api.js`)**:
   - Centralizar la URL base (`API_BASE_URL`) detectando automáticamente el host de desarrollo de Expo/emulador (`10.0.2.2` en emulador Android, `localhost` en iOS/Web, o IP LAN en dispositivo físico) y permitiendo configurarla fácilmente.
3. **Fidelidad Visual a los 12 Casos de Uso**:
   - **Catálogo de Eventos (Comprador)**: Barra de búsqueda por texto, chips de filtro por `Categoria`, selector de ordenamiento (`Precio`, `Fecha`, `Puntaje del Organizador`), y botón de Favorito (`♥`).
   - **Detalle de Evento (Comprador)**: Información del evento, puntaje promedio e historial de **reseñas de eventos anteriores del organizador**, lista de `TipoEntrada` con su precio y cupo disponible, selector de cantidad validando no superar el cupo, y botón de compra.
   - **Mis Compras (Comprador)**: Lista de compras con badge de color según `EstadoCompra`. Si el estado es `CONFIRMADA`, destacar visualmente **cuántos días faltan para el evento**. Botón de **Cancelar compra** (habilitado solo si no está `UTILIZADA`/`CANCELADA`/`REEMBOLSADA` y el evento no ocurrió) y botón de **Calificar evento** (habilitado cuando está `UTILIZADA`).
   - **Chat de Compra (Comprador y Organizador)**: Vista de mensajes dentro de cada compra permitiendo enviar y responder mensajes en cualquier momento.
   - **Panel de Organizador**: Formulario para crear `Evento` agregando múltiples `TipoEntrada` (nombre, descripción, precio, cupo), y vista de compras por evento diferenciando estados y **cuántas entradas quedan disponibles de cada tipo**.

