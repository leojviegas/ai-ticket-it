# Especificación de Feature 02: Compras, Seguimiento de Estados, Disponibilidad y Cancelación

## 1. Casos de Uso Cubiertos

- **CU 1**: Como comprador, quiero poder visualizar mis compras, diferenciando con claridad el estado en el que se encuentran y cuántos días faltan para el evento en caso de estar en estado **confirmada**.
- **CU 2**: Como organizador, quiero poder visualizar las compras asociadas a un Evento en particular, diferenciando con claridad el estado en el que se encuentran y cuántas entradas quedan disponibles de cada tipo.
- **CU 7**: Como comprador, quiero poder cancelar una compra para obtener el reembolso en caso de no poder asistir al evento.
- **CU 8**: Como organizador, quiero que los compradores puedan cancelar una compra siempre que la misma no se encuentre en estado **utilizada** y el evento aún no se haya realizado.
- **CU 12**: Como comprador, quiero poder realizar una compra sobre un Evento seleccionando uno de los tipos de entrada disponibles y la cantidad deseada, sin superar el cupo disponible.

---

## 2. Reglas de Negocio y Flujos

### 2.1. Compra de Entradas con Control de Cupo (CU 12)
1. El comprador elige un `TipoEntrada` del evento e indica la `cantidad` deseada (`>= 1`).
2. El sistema verifica `tipoEntrada.hayCupoPara(cantidad)`.
3. Si la cantidad solicitada supera `tipoEntrada.cupo`, se rechaza la operación informando el cupo disponible.
4. Si hay cupo, se descuenta inmediatamente de `tipoEntrada.cupo`, se calcula `total = tipoEntrada.precio * cantidad` y se registra la `Compra` en estado `CONFIRMADA` junto con su `CambioEstadoCompra`.

### 2.2. Visualización de Compras del Comprador y Días Faltantes (CU 1)
1. En la sección "Mis Compras", cada compra muestra un indicador visual distintivo para su estado (`PENDIENTE`, `CONFIRMADA`, `UTILIZADA`, `CANCELADA`, `REEMBOLSADA`).
2. Únicamente cuando el estado es `CONFIRMADA`, se muestra de forma destacada la leyenda con la cantidad de días restantes hasta `evento.fecha` (`calcularDiasParaEvento()`).

### 2.3. Visualización de Ventas y Cupos por Evento (Organizador — CU 2)
1. El organizador selecciona uno de sus eventos y visualiza:
   - El resumen de cada `TipoEntrada` del evento con su **cupo disponible actual** y la cantidad de entradas vendidas.
   - El listado de todas las `Compra` asociadas al evento, diferenciando con claridad su `EstadoCompra`, comprador, tipo de entrada, cantidad y total.

### 2.4. Cancelación y Reembolso (CU 7 y CU 8)
1. El comprador puede cancelar su compra si y solo si:
   - `compra.estado !== EstadoCompra.UTILIZADA` (ni está ya cancelada/reembolsada).
   - `compra.evento.fecha > ahora` (el evento aún no se realizó).
2. Al cancelar:
   - Se registra el paso por `CANCELADA` y `REEMBOLSADA` en `cambiosEstado`.
   - Se restituye `compra.cantidad` al `cupo` del `TipoEntrada` correspondiente.

---

## 3. Criterios de Aceptación

- [ ] No es posible comprar más entradas que el `cupo` disponible del `TipoEntrada` seleccionado.
- [ ] En "Mis Compras", las compras en estado `CONFIRMADA` muestran exactamente cuántos días faltan para el evento; las compras en otros estados no muestran dicho contador.
- [ ] El organizador visualiza para cada evento tanto el cupo remanente de cada `TipoEntrada` como las compras realizadas y sus estados.
- [ ] Si una compra está `CONFIRMADA` y el evento es futuro, el comprador puede cancelarla, pasando a `REEMBOLSADA` y devolviendo el cupo al `TipoEntrada`.
- [ ] Si la compra está `UTILIZADA` o el evento ya ocurrió, el sistema impide la cancelación.

