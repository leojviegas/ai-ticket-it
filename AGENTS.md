# AGENTS.md — Guía Global para Agentes de IA (`ai-ticket-it`)

Este archivo define las reglas globales, el contexto arquitectónico y el flujo de trabajo para cualquier agente de Inteligencia Artificial que opere en el repositorio **AI Ticket It**.

---

## 1. Contexto del Proyecto

**AI Ticket It** es una plataforma mobile de publicación de eventos y venta de entradas (Trabajo Práctico de Desarrollo con IA). Conecta dos roles principales:
- **Organizador**: Publica eventos, configura tipos de entrada (nombre, descripción, precio, cupo), visualiza ventas y cupos remanentes, y responde consultas en el chat de cada compra.
- **Comprador**: Explora eventos por texto o categoría, ordena por precio/fecha/puntaje del organizador, guarda favoritos, compra entradas validando cupo, visualiza días restantes para eventos con compra confirmada, conversa por chat con el organizador, cancela compras (obteniendo reembolso si no fue utilizada y el evento no ocurrió) y califica eventos una vez utilizada la entrada.

La fuente de verdad del enunciado y el diagrama de clases tentativo se encuentran en `docs/enunciado.md`.

---

## 2. Requerimientos Técnicos Innegociables

1. **Arquitectura**: Monolito modular dividido en `/backend` y `/frontend`.
2. **Back-End (`/backend`)**:
   - **Node.js + Express**.
   - **Persistencia en memoria**: Todos los datos deben almacenarse en memoria (estructuras en memoria encapsuladas en repositorios con datos iniciales/seed para facilitar pruebas y demostración). No utilizar bases de datos externas que requieran instalación adicional.
3. **Front-End (`/frontend`)**:
   - **React Native** ejecutable de forma local en un dispositivo móvil físico o emulador.
4. **Fidelidad al Modelo de Dominio**:
   - Respetar las entidades y responsabilidades del diagrama tentativo (`Usuario`, `Evento`, `Categoria`, `TipoEntrada`, `Compra`, `EstadoCompra`, `CambioEstadoCompra`, `Mensaje`, `Resenia`).

---

## 3. Flujo de Trabajo: Spec-Driven Development (SDD)

Todo el desarrollo en este repositorio sigue un enfoque guiado por especificaciones (**Spec-Driven Development**):

1. **Consultar `docs/enunciado.md` y `specs/`** antes de escribir o modificar código.
2. **Generar o actualizar la Spec** correspondiente en `specs/` (`domain/`, `api/`, `features/` o `ui/`) utilizando las skills del proyecto ubicadas en `.agents/skills/`.
3. **Implementar en Back-End (`/backend`)** respetando las reglas de `backend/AGENTS.md`.
4. **Implementar en Front-End (`/frontend`)** respetando las reglas de `frontend/AGENTS.md`.
5. **Documentar decisiones importantes** en `docs/adr/` y aprendizajes relevantes sobre el uso de IA en `docs/ai-log/`.

---

## 4. Estructura de Customizaciones de IA

- `.agents/skills/`: Skills específicas del proyecto (`SKILL.md`). Léelas siempre cuando una tarea coincida con su descripción.
- `.agents/rules/`: Reglas adicionales de estilo, dominio y arquitectura.
- `.agents/commands/`: Comandos y flujos operativos reutilizables.
- `.agents/hooks.json`: Hooks del ciclo de vida del agente.
- `backend/AGENTS.md` y `frontend/AGENTS.md`: Reglas jerárquicas específicas de cada módulo.

