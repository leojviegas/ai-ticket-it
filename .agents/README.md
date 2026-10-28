# Directorio `.agents/` — Configuración del Sistema de Agentes

Esta carpeta centraliza todas las customizaciones descubiertas automáticamente por el agente de IA:

- **`skills/`**: Contiene paquetes modulares de conocimiento y procedimientos (`<skill-name>/SKILL.md`). Se cargan bajo demanda (*progressive disclosure*).
- **`rules/`**: Reglas contextuales adicionales en formato Markdown (`*.md`).
- **`commands/`**: Flujos operativos y prompts estructurados reutilizables para tareas frecuentes del proyecto.
- **`hooks.json` y `hooks/`**: Definición de *Lifecycle Hooks* (`SessionStart`, `PreToolUse`, `PostToolUse`, `PreInvocation`, `PostInvocation`, `Stop`) y sus scripts asociados.

