# Especificaciones del Proyecto (`specs/`) — Spec-Driven Development

Toda funcionalidad de **AI Ticket It** se especifica en esta carpeta antes de su implementación en código.

## Estructura de `specs/`

- **`domain/`**: Especificaciones detalladas de las entidades del modelo de dominio (`Usuario`, `Evento`, `Categoria`, `TipoEntrada`, `Compra`, `EstadoCompra`, `CambioEstadoCompra`, `Mensaje`, `Resenia`), invariantes y máquina de estados.
- **`api/`**: Contratos de la API REST en Node.js + Express (rutas, payloads de request/response, códigos de estado HTTP y errores).
- **`features/`**: Especificaciones funcionales por Caso de Uso del enunciado (criterios de aceptación, flujos principales y alternativos).
- **`ui/`**: Especificaciones de las pantallas y componentes de React Native (vistas de Comprador y Organizador, estados de carga/error, navegación).
- **`templates/`**: Plantillas estandarizadas utilizadas por las skills generadoras de specs.

