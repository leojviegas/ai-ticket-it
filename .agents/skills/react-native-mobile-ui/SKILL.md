---
name: react-native-mobile-ui
description: >-
  Use this skill when building or modifying React Native screens, components,
  navigation, state context, or API client services in the frontend/ directory.
---

# React Native Mobile UI Skill (`frontend/`)

Esta skill guía el desarrollo del módulo Front-End en **React Native** para **AI Ticket It**, siguiendo un diseño de **interfaz única unificada** (al estilo YouTube + YouTube Studio) donde cualquier usuario puede tanto explorar y comprar entradas como publicar y gestionar sus propios eventos.

---

## 1. Principios de Diseño Mobile para el TP

1. **Interfaz Única Unificada**:
   - Todos los usuarios ven la misma aplicación con navegación principal integrada:
     - **Explorar**: Catálogo de eventos con búsqueda por texto, filtro por categoría y ordenamiento por precio mínimo, fecha y puntaje del organizador.
     - **Mis Entradas**: Compras realizadas por el usuario con estado claro, días restantes si está `CONFIRMADA`, cancelación (que pasa a `CANCELADA`), calificación (si está `UTILIZADA`) y chat.
     - **Favoritos**: Eventos guardados.
     - **Ticket Studio (Productor / Organizador)**: Sección estilo *YouTube Studio* para publicar nuevos eventos con múltiples `TipoEntrada` y gestionar los eventos propios (ver cupos remanentes por tipo de entrada, ver compras por estado, **Confirmar** compras pendientes, **Reembolsar** compras canceladas, marcar entradas como **Utilizadas** y responder el **Chat** de cada compra).
2. **Conexión Local con el Back-End (`src/services/api.js`)**:
   - Centralizar la URL base (`API_BASE_URL`) detectando automáticamente el host de desarrollo de Expo/emulador (`10.0.2.2` en emulador Android, `localhost` en iOS/Web, o IP LAN en dispositivo físico).
