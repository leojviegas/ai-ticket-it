import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MARKER_REGEX = /\[le[ií]da\]/i;

function stripHtmlComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, "");
}

function countUnreadInPendingSection(sectionText) {
  const lines = stripHtmlComments(sectionText).split(/\r?\n/);
  let unread = 0;
  let insideReadHeadingBlock = false;
  let insideUnreadHeadingBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line === "---") {
      continue;
    }

    if (line.startsWith("###")) {
      if (MARKER_REGEX.test(line)) {
        insideReadHeadingBlock = true;
        insideUnreadHeadingBlock = false;
      } else {
        insideReadHeadingBlock = false;
        insideUnreadHeadingBlock = true;
        unread += 1;
      }
      continue;
    }

    if (insideReadHeadingBlock || insideUnreadHeadingBlock) {
      continue;
    }

    if (!MARKER_REGEX.test(line)) {
      unread += 1;
    }
  }

  return unread;
}

function countUnreadTrailingNotes(historySectionText) {
  const lines = stripHtmlComments(historySectionText).split(/\r?\n/);
  let unread = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line === "---" || line.startsWith("|") || line.startsWith("#")) {
      continue;
    }
    if (!MARKER_REGEX.test(line)) {
      unread += 1;
    }
  }

  return unread;
}

export function countUnreadDoubts(content) {
  const pendingMatch = content.match(
    /##\s*1\.\s*Dudas Pendientes[\s\S]*?(?=##\s*2\.\s*Historial de Dudas Resueltas|$)/i
  );
  const historyMatch = content.match(/##\s*2\.\s*Historial de Dudas Resueltas[\s\S]*$/i);

  let totalUnread = 0;

  if (pendingMatch) {
    const pendingBody = pendingMatch[0].replace(/^##\s*1\..*$/m, "");
    totalUnread += countUnreadInPendingSection(pendingBody);
  }

  if (historyMatch) {
    const historyBody = historyMatch[0].replace(/^##\s*2\..*$/m, "");
    totalUnread += countUnreadTrailingNotes(historyBody);
  }

  return totalUnread;
}

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  try {
    const currentDir = path.dirname(currentFilePath);
    const dudasPath = path.resolve(currentDir, "../../docs/dudas.md");

    if (fs.existsSync(dudasPath)) {
      const content = fs.readFileSync(dudasPath, "utf-8");
      const unreadCount = countUnreadDoubts(content);

      if (unreadCount > 0) {
        process.stdout.write(
          JSON.stringify({
            injectSteps: [
              {
                ephemeralMessage: `Recordatorio de hook: hay ${unreadCount} duda(s) nueva(s) sin leer en docs/dudas.md. Respóndelas con alternativas e implicancias y márcalas inmediatamente con [LEIDA] en docs/dudas.md para no volver a responderlas en futuros chats (ignora las que ya tienen [LEIDA]).`,
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
}
