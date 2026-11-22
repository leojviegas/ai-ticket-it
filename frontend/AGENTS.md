# AGENTS.md — Reglas del Módulo Front-End (`frontend/`)

Este archivo define las directrices específicas para el desarrollo del Front-End Mobile de **AI Ticket It**.

---

## 1. Stack y Ejecución

- **Framework**: React Native (orientado a ejecución local en dispositivo móvil / emulador).
- **Comunicación con Back-End**: Consumo de la API REST local mediante la capa `src/services/`.

---

## 2. Organización del Código (`frontend/src/`)

- **`screens/`**: Pantallas principales separadas o adaptadas según el flujo de **Comprador** (explorar/buscar/ordenar eventos, detalle de evento y reseñas del organizador, mis compras con contador de días, chat de compra, calificar evento) y **Organizador** (mis eventos, crear evento con tipos de entrada, ver ventas y cupos por evento, responder chat de compra).
- **`components/`**: Componentes reutilizables (tarjetas de evento, badges de `EstadoCompra`, filtros y barra de búsqueda, burbujas de chat, selector de entradas).
- **`navigation/`**: Configuración de rutas y navegación mobile.
- **`context/`**: Estado global de la aplicación (cambio rápido de usuario/rol Comprador ↔ Organizador para facilitar pruebas y el video de demostración, favoritos, etc.).
- **`services/`**: Cliente HTTP centralizado hacia el Back-End.
- **`types/`**: Definiciones de estructuras de datos sincronizadas con `specs/domain/` y `specs/api/`.
- **`theme/`**: Paleta de colores, espaciados y estilos consistentes.
- **`utils/`**: Formateo de fechas, cálculo visual de días restantes y helpers.

