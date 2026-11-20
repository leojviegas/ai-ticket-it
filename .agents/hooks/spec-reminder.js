import fs from "node:fs";
import path from "node:path";

try {
  const dudasPath = path.resolve(process.cwd(), "../docs/dudas.md");
  if (fs.existsSync(dudasPath)) {
    const content = fs.readFileSync(dudasPath, "utf-8");
    const hasPending = content.includes("### DUDA-");
    if (hasPending) {
      process.stdout.write(
        JSON.stringify({
          injectSteps: [
            {
              ephemeralMessage:
                "Recordatorio de hook: revisa docs/dudas.md al inicio de este turno para verificar si hay dudas pendientes o nuevas del desarrollador.",
            },
          ],
        })
      );
      process.exit(0);
    }
  }
} catch {
  // Ignorar errores para no bloquear el ciclo del agente
}

process.stdout.write(JSON.stringify({}));
