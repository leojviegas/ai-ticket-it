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
4. Si hay cupo, se descuenta inmediatamente de `tipoEntrada.cupo`, se calcula `total = tipoEntrada.precio * cantidad` y se registra la `Compra` en estado **`PENDIENTE`** junto con su `CambioEstadoCompra`.
5. Posteriormente, el organizador del evento confirma la compra desde su sección de gestión, pasándola a estado **`CONFIRMADA`**.

### 2.2. Visualización de Compras del Comprador y Días Faltantes (CU 1)
1. En la sección de compras del usuario, cada compra muestra un indicador visual distintivo para su estado (`PENDIENTE`, `CONFIRMADA`, `UTILIZADA`, `CANCELADA`, `REEMBOLSADA`).
2. Únicamente cuando el estado es `CONFIRMADA`, se muestra de forma destacada la leyenda con la cantidad de días restantes hasta `evento.fecha` (`calcularDiasParaEvento()`).

### 2.3. Visualización de Ventas y Cupos por Evento (Organizador — CU 2)
1. En la sección de gestión del organizador, al seleccionar uno de sus eventos publicados visualiza:
   - El resumen de cada `TipoEntrada` del evento con su **cupo disponible actual** y la cantidad de entradas vendidas.
   - El listado de todas las `Compra` asociadas al evento, diferenciando con claridad su `EstadoCompra`, comprador, tipo de entrada, cantidad y total, junto con los botones de acción según el estado: `Confirmar` si está `PENDIENTE`, `Cancelar` si está `PENDIENTE` o `CONFIRMADA` (antes de la fecha del evento), o `Reembolsar` si está `CANCELADA`. Las compras `CONFIRMADA` pasan automáticamente a `UTILIZADA` cuando llega la fecha del evento, sin acción manual del organizador.

### 2.4. Cancelación y Reembolso en 2 Pasos (CU 7 y CU 8)
1. Tanto el comprador como el organizador pueden cancelar una compra si y solo si:
   - `compra.estado === EstadoCompra.PENDIENTE || compra.estado === EstadoCompra.CONFIRMADA` (no está `UTILIZADA`, ni ya cancelada/reembolsada).
   - `compra.evento.fecha > ahora` (el evento aún no se realizó).
2. Al cancelar por parte del comprador o del organizador:
   - La compra pasa a estado **`CANCELADA`** (registrando el `CambioEstadoCompra` con el usuario que ejecutó la cancelación).
   - Se restituye `compra.cantidad` al `cupo` del `TipoEntrada` correspondiente.
3. Reembolso por parte del organizador:
   - El organizador ve la compra en estado `CANCELADA` y presiona el botón **"Reembolsar"**, momento en el cual la compra pasa al estado **`REEMBOLSADA`** (registrando el `CambioEstadoCompra`).

---

## 3. Criterios de Aceptación

- [ ] No es posible comprar más entradas que el `cupo` disponible del `TipoEntrada` seleccionado.
- [ ] Toda compra nueva nace en estado `PENDIENTE` y pasa a `CONFIRMADA` cuando el organizador la confirma.
- [ ] Cuando llega la fecha y hora del evento (`evento.fecha <= ahora`), toda compra en estado `CONFIRMADA` pasa automáticamente a estado `UTILIZADA` sin intervención manual.
- [ ] En las compras del usuario, aquellas en estado `CONFIRMADA` muestran exactamente cuántos días faltan para el evento; las compras en otros estados no muestran dicho contador.
- [ ] El organizador visualiza para cada evento tanto el cupo remanente de cada `TipoEntrada` como las compras realizadas y sus estados.
- [ ] Si una compra está `PENDIENTE` o `CONFIRMADA` y el evento es futuro, tanto el comprador como el organizador pueden cancelarla pasando a `CANCELADA` y devolviendo el cupo al `TipoEntrada`.
- [ ] El organizador puede reembolsar con un botón una compra en estado `CANCELADA`, pasándola a `REEMBOLSADA`.
- [ ] Si la compra está `UTILIZADA` o el evento ya ocurrió, el sistema impide la cancelación.
