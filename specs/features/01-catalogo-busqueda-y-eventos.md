# Especificación de Feature 01: Catálogo, Búsqueda, Ordenamiento y Creación de Eventos

## 1. Casos de Uso Cubiertos

- **CU 3**: Como comprador, quiero poder buscar Eventos de forma específica mediante una búsqueda textual o explorarlos por categorías.
- **CU 4**: Como organizador, quiero poder crear un Evento ofreciendo distintos tipos de entrada, cada uno con su precio y cupo, permitiendo adaptarse a diferentes públicos y presupuestos.
- **CU 10**: Como comprador, quiero que las reseñas de eventos anteriores se visualicen en los Eventos de cada organizador para conocer experiencias previas antes de comprar.
- **CU 11**: Como comprador, al buscar Eventos, quiero poder ordenarlos por precio, fecha del evento y puntaje del organizador.
- **Contexto General**: Guardar eventos favoritos en el perfil del usuario.

---

## 2. Reglas de Negocio y Flujos

### 2.1. Exploración, Búsqueda y Ordenamiento (Comprador)
1. **Búsqueda Textual**: Filtra eventos cuyo `nombre` o `descripcion` contenga el texto buscado (sin distinguir mayúsculas/minúsculas ni tildes).
2. **Filtro por Categoría**: Permite seleccionar una `Categoria` específica o ver "Todas".
3. **Filtro por Rango de Precio**: Utiliza el método de dominio `evento.tuPrecioEstaEntre(min, max)`.
4. **Ordenamiento (CU 11)**:
   - Por **Precio**: Ordena según el menor precio (`obtenerPrecioMinimo()`) de los `tiposEntrada` de cada evento.
   - Por **Fecha del Evento**: Ordena cronológicamente según `evento.fecha`.
   - Por **Puntaje del Organizador**: Ordena según el promedio de `puntuacion` de todas las `Resenia` recibidas por el `organizador` del evento en todos sus eventos.

### 2.2. Visualización de Reseñas del Organizador en el Evento (CU 10)
- Al abrir el detalle de un `Evento`, se muestra la información del `organizador`, su puntaje promedio histórico y el listado de reseñas de eventos anteriores organizados por ese mismo `Usuario` (indicando a qué evento corresponde cada reseña, quién la escribió, puntuación y comentario).

### 2.3. Creación de Evento con Tipos de Entrada (Organizador — CU 4)
- El organizador ingresa nombre, descripción, categoría, fecha, URLs multimedia opcionales y al menos un `TipoEntrada` (con nombre como "General", "Platea", "VIP", descripción, precio `>= 0` y cupo entero `> 0`).

---

## 3. Criterios de Aceptación

- [ ] El comprador puede buscar eventos por texto libre y combinarlo con el filtro de categoría.
- [ ] El comprador puede cambiar el criterio de ordenamiento entre Precio, Fecha y Puntaje del Organizador.
- [ ] En el detalle de cualquier evento de un organizador se visualizan las reseñas de eventos anteriores de dicho organizador.
- [ ] El organizador puede publicar un evento con 1 o más tipos de entrada, cada uno con su propio precio y cupo.

