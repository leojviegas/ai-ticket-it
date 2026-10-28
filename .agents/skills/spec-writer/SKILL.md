---
name: spec-writer
description: >-
  Use this skill when the user asks to create, update, or review project specifications
  in the specs/ directory (domain, API contracts, functional features/use cases, or mobile UI)
  based on docs/enunciado.md and docs/diagrama-clases.md.
---

# Spec Writer Skill (`ai-ticket-it`)

Esta skill guía la redacción y mantenimiento de especificaciones bajo la metodología **Spec-Driven Development (SDD)** del proyecto **AI Ticket It**.

---

## 1. Fuentes de Verdad Obligatorias

Antes de redactar o modificar cualquier especificación en `specs/`, debes leer:
1. [docs/enunciado.md](../../docs/enunciado.md): Objetivos, contexto y los 12 Casos de Uso oficiales.
2. [docs/diagrama-clases.md](../../docs/diagrama-clases.md): Clases, atributos, firmas exactas de métodos y relaciones del Diagrama Tentativo.
3. [docs/adr/001-decisiones-disenio-dominio-y-flujos.md](../../docs/adr/001-decisiones-disenio-dominio-y-flujos.md): Resoluciones adoptadas para los grises del enunciado.

---

## 2. Tipos de Especificaciones y Ubicación

| Categoría | Carpeta Destino | Plantilla Base | Qué debe especificar |
| :--- | :--- | :--- | :--- |
| **Dominio** | `specs/domain/` | [specs/templates/domain-spec.template.md](../../specs/templates/domain-spec.template.md) | Entidades, enums, constructores, invariantes de validación, métodos de negocio, errores (`DomainValidationError`, `InvalidStateTransitionError`) y casos borde para Mutation Testing. |
| **API REST** | `specs/api/` | [specs/templates/api-spec.template.md](../../specs/templates/api-spec.template.md) | Endpoints Express, métodos HTTP, query/path params, esquemas Zod de entrada, formato JSON de salida y mapeo de errores HTTP (400, 404, 409). |
| **Features (Casos de Uso)** | `specs/features/` | [specs/templates/feature-spec.template.md](../../specs/templates/feature-spec.template.md) | Actor (Comprador / Organizador), precondiciones, flujo principal, flujos alternativos/errores y criterios de aceptación verificables. |
| **UI Mobile** | `specs/ui/` | [specs/templates/ui-spec.template.md](../../specs/templates/ui-spec.template.md) | Pantallas React Native, componentes, navegación, estado global (selector de rol Comprador/Organizador) e interacción con endpoints del Back-End. |

---

## 3. Procedimiento Paso a Paso

1. **Identificar el alcance**: Determinar qué entidades del diagrama o cuáles de los 12 casos de uso están involucrados.
2. **Verificar trazabilidad con el Diagrama de Clases**:
   - Nunca alterar los nombres de clases ni firmas públicas del diagrama (`Evento.tuPrecioEstaEntre`, `TipoEntrada.hayCupoPara`, `Compra.actualizarEstado`).
   - Si se requiere un atributo o método adicional (como `id`, `descontarCupo`, `restituirCupo`, `calcularDiasParaEvento`), documentarlo explícitamente como extensión compatible.
3. **Explicitar invariantes para Stryker Mutation**:
   - En las specs de dominio, detallar exactamente las condiciones de borde (`>`, `>=`, `<`, `<=`, strings vacíos, nulos) que los tests de Jest deberán cubrir para matar mutantes.
4. **Validar consistencia transversal**:
   - Todo campo requerido por una pantalla en `specs/ui/` debe existir en la respuesta de `specs/api/` y originarse en `specs/domain/`.

