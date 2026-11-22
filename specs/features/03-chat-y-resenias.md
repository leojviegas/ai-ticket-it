# Especificación de Feature 03: Chat por Compra y Calificación de Eventos (`Resenia`)

## 1. Casos de Uso Cubiertos

- **CU 5**: Como comprador, quiero poder enviar mensajes en cualquier momento relacionados a una compra mediante un chat dentro de la misma.
- **CU 6**: Como organizador, quiero poder responder mensajes en cualquier momento relacionados a una compra mediante un chat dentro de la misma.
- **CU 9**: Como organizador, quiero que una vez **utilizada** una entrada el comprador pueda puntuar el Evento de forma numérica y dejar un comentario escrito.
- **CU 10**: Como comprador, quiero que las reseñas de eventos anteriores se visualicen en los Eventos de cada organizador para conocer experiencias previas antes de comprar.

---

## 2. Reglas de Negocio y Flujos

### 2.1. Chat Integrado en cada Compra (CU 5 y CU 6)
1. Cada `Compra` posee su propia colección de `mensajes: Mensaje[]`.
2. Tanto el `comprador` de la compra como el `organizador` del evento pueden enviar mensajes en **cualquier momento** (independientemente del `EstadoCompra`).
3. Cada `Mensaje` almacena el `usuario` autor, el texto `mensaje` (no vacío) y la fecha/hora `enviado`.
4. Cualquier usuario que no sea ni el comprador de esa compra ni el organizador del evento tiene prohibido publicar mensajes en ese chat.

### 2.2. Puntuación y Comentario de Evento (CU 9 y CU 10)
1. **Precondición**: La compra del comprador para ese evento debe encontrarse en estado `UTILIZADA`. (En la interfaz del organizador o en el detalle de la compra se provee la acción de validar/marcar entrada como `UTILIZADA` para poder probar el ciclo completo en vivo).
2. El comprador ingresa:
   - `puntuacion`: valor numérico de `1` a `5`.
   - `detalle`: comentario escrito obligatorio.
3. Una vez creada la `Resenia`, el puntaje promedio del organizador se actualiza inmediatamente y la reseña aparece en todos los eventos publicados por ese organizador.

---

## 3. Criterios de Aceptación

- [ ] El comprador puede abrir una compra en cualquier estado y enviar un mensaje en su chat.
- [ ] El organizador puede entrar a las compras de su evento, ver los mensajes del comprador y responderlos en el mismo chat.
- [ ] Un comprador con compra en estado `UTILIZADA` puede calificar el evento con puntaje numérico (1 a 5) y comentario escrito.
- [ ] Un comprador cuya compra esté en estado `PENDIENTE`, `CONFIRMADA`, `CANCELADA` o `REEMBOLSADA` no puede calificar el evento.

