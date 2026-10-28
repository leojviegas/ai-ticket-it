---
name: backend-api-layer
description: >-
  Use this skill when implementing or updating backend repositories (in-memory),
  services, Zod validation schemas, Express controllers, routes, middlewares,
  seeders, or backend integration/unit tests.
---

# Backend API Layer Skill (`backend/`)

Esta skill guía la construcción de las capas de persistencia en memoria, servicios, esquemas de validación y controladores HTTP en `backend/`, respetando las convenciones arquitectónicas de la cátedra.

---

## 1. Arquitectura y Responsabilidades por Capa

1. **Repositorios en Memoria (`src/repositories/`)**:
   - Almacenan las instancias de dominio en colecciones en memoria (`Map` indexado por `id`).
   - Exponen métodos claros (`save`, `findById`, `findAll`, `delete`, `clear` para tests, y métodos de consulta específicos).
   - Lanzan errores de `src/repositories/errors/RepositoryError.js` (`EntityNotFoundError`, `DuplicateEntityError`) cuando corresponda.
2. **Servicios (`src/services/`)**:
   - Contienen la lógica de aplicación y orquestación de los 12 Casos de Uso.
   - Coordinan múltiples repositorios (ej. al crear una `Compra`, obtienen `Usuario` y `Evento`, verifican y descuentan cupo en `TipoEntrada`, instancian `Compra` y la guardan).
   - Lanzan errores de `src/services/errors/ServiceError.js` (`NotFoundError`, `ConflictError`, `BusinessRuleError`) o dejan propagar errores de dominio (`DomainValidationError`, `InvalidStateTransitionError`).
3. **Esquemas de Validación (`src/schemas/`)**:
   - Usan `zod` para validar `req.body` y `req.query` antes de invocar al servicio.
4. **Controladores (`src/controllers/`) y Rutas (`src/routes/`)**:
   - Parsean la entrada (lanzando `RequestValidationError` de `src/controllers/errors/ControllerError.js` si falla la validación), llaman al servicio y responden con el código HTTP apropiado (`200`, `201`, `204`).
5. **Manejo Centralizado de Errores (`src/middlewares/errorHandler.js`)**:
   - Mapea declarativamente:
     - `RequestValidationError`, `DomainValidationError`, `BusinessRuleError` → `400 Bad Request`
     - `EntityNotFoundError`, `NotFoundError` → `404 Not Found`
     - `InvalidStateTransitionError`, `ConflictError`, `DuplicateEntityError` → `409 Conflict`
     - Cualquier otro error no controlado → `500 Internal Server Error`
6. **Seeders en Memoria (`data/seeders/`)**:
   - `demoSeeder.js` precarga usuarios (organizadores y compradores), categorías, eventos con múltiples `TipoEntrada`, compras en distintos estados (`PENDIENTE`, `CONFIRMADA`, `UTILIZADA`, `CANCELADA`, `REEMBOLSADA`), mensajes de chat y reseñas para que la app mobile sea demostrable desde el primer segundo.

