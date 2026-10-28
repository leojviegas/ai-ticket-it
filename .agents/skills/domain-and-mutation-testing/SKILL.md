---
name: domain-and-mutation-testing
description: >-
  Use this skill when implementing or modifying domain entities, enums, domain errors,
  unit tests in backend/tests/domain/, or running Jest and Stryker Mutation testing
  in the backend module.
---

# Domain & Mutation Testing Skill (`backend/`)

Esta skill define el flujo estricto para implementar el modelo de dominio de **AI Ticket It** y verificar su calidad con **Jest** y **Stryker Mutator** siguiendo el estándar del proyecto de referencia `2026-2c-lu-sa-grupo-7`.

---

## 1. Reglas de Implementación del Dominio (`backend/src/domain/`)

1. **Ubicación**:
   - Entidades en `backend/src/domain/entities/*.js` (archivos mutados por `stryker.config.mjs`).
   - Enumeraciones en `backend/src/domain/enums/*.js` (usando `Object.freeze({...})`).
   - Errores en `backend/src/domain/errors/DomainError.js` (`DomainError`, `DomainValidationError`, `InvalidStateTransitionError`).
2. **Constructores e Invariantes**:
   - Recibir un objeto desestructurado con `id` numérico autoincremental (o asignado al instanciar/guardar).
   - Validar todos los datos obligatorios al inicio del constructor y lanzar `DomainValidationError` con mensajes claros en español.
   - Evitar código muerto o ramas inalcanzables en `src/domain/entities/**/*.js`, ya que Stryker generará mutantes sobrevivientes si una condición es redundante.
3. **Serialización**:
   - Proveer método `toJSON()` limpio en cada entidad para estandarizar las respuestas.

---

## 2. Reglas para Matar Mutantes en `backend/tests/domain/`

Cuando escribas tests con Jest para `src/domain/entities/**/*.js`, asegúrate de cubrir:
- **Mutantes de Bordes (`EqualityOperator`)**: Si el dominio valida `cantidad <= 0` o `cupo >= cantidad` o `precio >= min && precio <= max`, debes escribir un test con el valor exacto del límite (`0`, `cupo === cantidad`, `precio === min`, `precio === max`), uno por debajo y uno por encima.
- **Mutantes de Expresiones Lógicas (`LogicalOperator` / `ConditionalExpression`)**: Si un `if (!comprador || !evento)` tiene múltiples condiciones, testea cada condición faltante por separado además del caso vacío `new Entidad()`.
- **Mutantes de String Literal**: Verifica el mensaje o el tipo de error lanzado (`DomainValidationError` / `InvalidStateTransitionError`).
- **Mutantes de Valores por Defecto**: Verifica los valores por defecto del constructor (ej. `id` definido, arrays inicializados como `[]`, fechas `instanceof Date`).

---

## 3. Comandos de Verificación

1. Ejecutar suite de Jest en `backend/`:
   ```bash
   npm test
   ```
2. Ejecutar Stryker Mutation Testing en `backend/`:
   ```bash
   npm run mutation
   ```
3. Analizar el reporte en consola (`clear-text`) y en `backend/reports/mutation/mutation.html` para eliminar cualquier mutante sobreviviente.

