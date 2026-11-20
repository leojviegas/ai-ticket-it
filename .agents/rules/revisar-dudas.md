# Regla: Revisión Obligatoria de `docs/dudas.md`

Antes de iniciar cada turno, lectura o acción sobre el proyecto:
1. Leer el archivo `docs/dudas.md`.
2. Verificar si el desarrollador agregó dudas nuevas **sin la marca `[LEIDA]`** (ya sea en la sección **1. Dudas Pendientes (Activas)** o como nota nueva al final del archivo).
3. Ignorar cualquier duda que ya contenga la marca `[LEIDA]` para no volver a mencionarla ni responderla en nuevos chats, salvo que el desarrollador la retome explícitamente.
4. Si existen dudas nuevas sin `[LEIDA]`:
   - Responderlas detallando las alternativas e implicancias técnicas y de negocio.
   - Marcar inmediatamente cada duda respondida con `[LEIDA]` dentro de `docs/dudas.md` (por ejemplo `- [LEIDA] ...` o `### [LEIDA] DUDA-XX: ...`).
   - Aguardar la confirmación del desarrollador antes de avanzar con la implementación de esos puntos.
5. Una vez que el desarrollador tome una decisión final, documentarla en `docs/adr/` y mover la duda a la sección **2. Historial de Dudas Resueltas** en `docs/dudas.md`.
