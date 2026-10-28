# AGENTS.md — Reglas del Módulo Back-End (`backend/`)

Este archivo define las directrices específicas para el desarrollo del Back-End de **AI Ticket It**.

---

## 1. Stack y Restricciones

- **Runtime y Framework**: Node.js + Express.
- **Persistencia en Memoria**: Prohibido utilizar motores de bases de datos externos. Toda la persistencia debe residir en memoria a través de la capa `src/repositories/`, incluyendo datos semilla (*seed data*) precargados al iniciar el servidor para permitir probar todos los casos de uso inmediatamente.

---

## 2. Arquitectura en Capas (`backend/src/`)

- **`domain/`**: Clases y entidades del modelo de negocio (`Usuario`, `Evento`, `Categoria`, `TipoEntrada`, `Compra`, `EstadoCompra`, `CambioEstadoCompra`, `Mensaje`, `Resenia`). Las reglas de negocio (como `hayCupoPara(cantidad)`, `tuPrecioEstaEntre(min, max)`, `actualizarEstado(estado)` y validaciones de cancelación/reseña) deben vivir en el dominio.
- **`repositories/`**: Almacenamiento en memoria (colecciones/Map) y consultas de filtrado/ordenamiento.
- **`services/`**: Orquestación de los casos de uso conectando repositorios y entidades de dominio.
- **`controllers/`**: Manejo de `req` y `res` HTTP, delegando toda lógica a `services/`.
- **`routes/`**: Definición de endpoints REST alineados con `specs/api/`.
- **`middlewares/`**: Manejo centralizado de errores, validación de datos de entrada y simulación de usuario activo.

