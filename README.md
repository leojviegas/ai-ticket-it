# AI Ticket It 🎟️

Trabajo Práctico Individual de **Desarrollo de Software con Inteligencia Artificial (2C 2026)**.

**AI Ticket It** es una plataforma para la publicación de eventos y venta de entradas desde dispositivos móviles, construida íntegramente bajo metodologías de **Agentic Coding** y **Spec-Driven Development (SDD)**.

---

## 🏗️ Arquitectura y Stack Tecnológico

El proyecto está organizado como un repositorio monolítico modular compuesto por dos módulos principales y una capa transversal de configuración para agentes de IA:

- **Back-End (`/backend`)**: Node.js + Express con persistencia en memoria (In-Memory Repositories) y modelo de dominio rico.
- **Front-End (`/frontend`)**: React Native para ejecución local en dispositivo móvil / emulador.
- **Infraestructura IA (`/.agents`, `/specs`, `/docs`, `AGENTS.md`)**: Ecosistema de reglas jerárquicas, skills, comandos, hooks, especificaciones funcionales/técnicas y bitácora de decisiones con IA.

---

## 📂 Estructura del Proyecto

```text
ai-ticket-it/
├── AGENTS.md                  # Instrucciones y contexto global para agentes de IA
├── README.md                  # Documentación principal del repositorio
├── .agents/                   # Configuración del sistema de agentes (Antigravity / AI)
│   ├── skills/                # Skills modulares (<skill-name>/SKILL.md)
│   ├── rules/                 # Reglas contextuales adicionales (*.md)
│   ├── commands/              # Comandos y flujos reutilizables
│   ├── hooks/                 # Scripts ejecutados por hooks de ciclo de vida
│   └── hooks.json             # Configuración de lifecycle hooks
├── specs/                     # Especificaciones (Spec-Driven Development)
│   ├── domain/                # Especificaciones del modelo de dominio y estados
│   ├── api/                   # Contratos de endpoints REST (Back-End)
│   ├── features/              # Especificaciones por Caso de Uso / funcionalidad
│   ├── ui/                    # Especificaciones de pantallas y flujos (Front-End)
│   └── templates/             # Plantillas base para nuevas specs
├── docs/                      # Documentación del proyecto y entrega académica
│   ├── enunciado.md           # Enunciado oficial y diagrama de dominio en Mermaid
│   ├── adr/                   # Architecture Decision Records (justificación técnica)
│   └── ai-log/                # Registro de iteraciones, prompts y conclusiones de IA
├── backend/                   # Módulo Back-End (Node.js + Express)
│   ├── AGENTS.md              # Reglas específicas del Back-End
│   ├── src/
│   │   ├── config/            # Configuración del servidor
│   │   ├── controllers/       # Controladores HTTP
│   │   ├── domain/            # Entidades de dominio y máquinas de estado
│   │   ├── middlewares/       # Validaciones, manejo de errores y contexto
│   │   ├── repositories/      # Persistencia en memoria y datos semilla (seed)
│   │   ├── routes/            # Definición de rutas REST
│   │   └── services/          # Lógica de aplicación / casos de uso
│   └── tests/                 # Pruebas unitarias e integración
└── frontend/                  # Módulo Front-End (React Native)
    ├── AGENTS.md              # Reglas específicas del Front-End
    └── src/
        ├── components/        # Componentes visuales reutilizables
        ├── context/           # Estado global (sesión Comprador/Organizador, etc.)
        ├── navigation/        # Configuración de navegación mobile
        ├── screens/           # Pantallas principales de la aplicación
        ├── services/          # Clientes HTTP y comunicación con el Back-End
        ├── theme/             # Tokens de diseño, colores y tipografía
        ├── types/             # Modelos de datos y tipado
        └── utils/             # Funciones auxiliares y formateadores
```
