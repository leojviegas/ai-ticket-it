# AGENTS.md — Reglas del Módulo Back-End (`backend/`)

Este archivo define las directrices específicas para el desarrollo del Back-End de **AI Ticket It**.

---

## 1. Stack, Módulos y Restricciones

- **Runtime y Framework**: Node.js + Express (`^5.1.0`) utilizando **ES Modules** (`"type": "module"` en `package.json`).
- **Persistencia en Memoria**: Prohibido utilizar motores de bases de datos externos (como MongoDB o PostgreSQL). Toda la persistencia debe residir en memoria a través de la capa `src/repositories/`, con datos semilla (*seeders*) en `data/seeders/` cargados al iniciar el servidor.
- **Validación de Esquemas**: Uso de `zod` en `src/schemas/`.

---

## 2. Testing y Mutation Testing (Innegociable)

- **Tests Unitarios y de Integración (`Jest`)**:
  - Se ejecutan con `npm test` (`cross-env NODE_OPTIONS=--experimental-vm-modules jest`).
  - Organizados en `tests/` espejando las capas de `src/` (`tests/domain/`, `tests/repositories/`, `tests/services/`, `tests/controllers/`, `tests/middlewares/`, `tests/seeders/`).
- **Mutation Testing (`Stryker Mutator`)**:
  - Se evalúa la calidad de los tests de dominio usando `@stryker-mutator/core` y `@stryker-mutator/jest-runner`.
  - Configurado en `stryker.config.mjs` apuntando a `mutate: ["src/domain/entities/**/*.js"]` con `coverageAnalysis: "perTest"`.
  - Se ejecuta con `npm run mutation` (`cross-env NODE_OPTIONS=--experimental-vm-modules stryker run`).
  - Los tests de `tests/domain/` deben diseñarse para matar los mutantes generados en las entidades de dominio (validaciones de constructor, transiciones de estado, cálculos de cupo, rangos de precio, etc.).

---

## 3. Arquitectura en Capas (`backend/`)

- **`src/domain/`**:
  - `entities/`: Clases del modelo de negocio (`Usuario`, `Evento`, `Categoria`, `TipoEntrada`, `Compra`, `CambioEstadoCompra`, `Mensaje`, `Resenia`). Toda entidad debe validar sus invariantes en el constructor y exponer su comportamiento de negocio (`hayCupoPara(cantidad)`, `tuPrecioEstaEntre(min, max)`, `actualizarEstado(estado)`).
  - `enums/`: Enumeraciones congeladas con `Object.freeze` (como `EstadoCompra`).
  - `errors/`: Jerarquía de errores de dominio (`DomainError`, `DomainValidationError`, `InvalidStateTransitionError`).
- **`src/repositories/`**:
  - Almacenamiento en memoria (`Map` / colecciones en memoria) y consultas de filtrado/ordenamiento.
  - `errors/`: Errores de persistencia (`RepositoryError`, `EntityNotFoundError`, `DuplicateEntityError`).
- **`src/services/`**:
  - Orquestación de casos de uso conectando repositorios y entidades de dominio.
  - `errors/`: Errores de negocio/servicio (`ServiceError`, `NotFoundError`, `ConflictError`, `BusinessRuleError`).
- **`src/controllers/`**:
  - Manejo HTTP (`req`, `res`), delegando lógica a `services/`.
  - `errors/`: Errores de entrada HTTP (`ControllerError`, `RequestValidationError`).
- **`src/schemas/`**: Esquemas de validación de entrada con `zod`.
- **`src/routes/`**: Definición de endpoints REST alineados con `specs/api/`.
- **`src/middlewares/`**: `errorHandler.js` (mapeo declarativo de errores por tipo a códigos HTTP 400, 404, 409, 500) y `notFoundHandler.js`.
- **`data/seeders/`**: Datos iniciales en memoria para catálogos y demostración completa de todos los flujos.
