# ADR 003: Inyección de Dependencias mediante `index.js` y Fachada del Dominio

- **Estado**: Aceptado
- **Fecha**: 2026-11-20
- **Origen**: Definición resuelta a partir de `docs/dudas.md` (`DUDA-07`)

---

## Contexto

En el módulo `backend/src/` existen archivos `index.js` en las carpetas `repositories/`, `services/` y `domain/`. Surgió la consulta sobre si conviene mantener estos archivos centralizados o reemplazarlos por imports directos desde cada archivo consumidor (por ejemplo, que `CategoriaService.js` importe directamente la instancia de `CategoriaRepository`).

---

## Decisión

Se adopta la **Opción A**: mantener el diseño actual con los archivos `index.js` diferenciando sus dos roles:

1. **`src/repositories/index.js` y `src/services/index.js` (Composition Root / Inyección de Dependencias)**:
   - `repositories/index.js` instancia los repositorios singleton en memoria y centraliza `clearAllRepositories()` para seeders y tests.
   - `services/index.js` ensambla las instancias de los servicios inyectando los repositorios y servicios colaboradores por constructor.
   - Las clases de servicio (`CategoriaService`, `EventoService`, `CompraService`, etc.) reciben sus dependencias por constructor y no se acoplan a singletons globales.
2. **`src/domain/index.js` (Barrel File / Fachada del Dominio)**:
   - Expone entidades, enumeraciones y errores de dominio desde un punto de entrada estable para el resto de las capas.

---

## Consecuencias

- **Positivas**:
  - Permite instanciar servicios en tests unitarios con repositorios aislados o dobles de prueba sin modificar código productivo.
  - Centraliza el cableado de dependencias en memoria en un único lugar por capa.
  - Evita que capas externas dependan de la estructura interna de subcarpetas de `src/domain/`.
- **Compromisos**:
  - Cada nuevo repositorio, servicio o entidad del dominio debe registrarse en su correspondiente `index.js`.
