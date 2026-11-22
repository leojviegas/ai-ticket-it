import { ApiError, SESSION_EXPIRED_MESSAGE } from "@/services/api";
import type { Compra } from "@/types/api";

const MESES_CORTOS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

export function formatCurrencyARS(amount: number): string {
  const rounded = Math.round(Number(amount) || 0);
  return "$" + rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function isSameCalendarDay(isoDate: string, referenceDate = new Date()): boolean {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth() &&
    date.getDate() === referenceDate.getDate()
  );
}

export function formatCalendarBadge(isoDate: string): { top: string; bottom: string } {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return { top: "--", bottom: "---" };
  }
  if (isSameCalendarDay(isoDate)) {
    return { top: "HOY", bottom: formatTimeOnly(isoDate) };
  }
  return {
    top: String(date.getDate()).padStart(2, "0"),
    bottom: MESES_CORTOS[date.getMonth()] ?? "---",
  };
}

export function formatTimeOnly(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const dd = String(date.getDate()).padStart(2, "0");
  const mes = MESES_CORTOS[date.getMonth()] ?? "";
  return `${dd} ${mes} ${date.getFullYear()} · ${formatTimeOnly(isoDate)} hs`;
}

export function formatDateShort(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  if (isSameCalendarDay(isoDate)) {
    return `Hoy · ${formatTimeOnly(isoDate)} hs`;
  }
  const dd = String(date.getDate()).padStart(2, "0");
  const mes = MESES_CORTOS[date.getMonth()] ?? "";
  return `${dd} ${mes} · ${formatTimeOnly(isoDate)} hs`;
}

export function getConfirmedCountdownLabel(
  eventoFechaIso: string,
  diasParaEvento: number | null
): string {
  if (isSameCalendarDay(eventoFechaIso)) {
    return "Hoy! 🥳";
  }
  const dias = Math.max(1, diasParaEvento ?? 1);
  return dias === 1 ? "Falta 1 día para el evento" : `Faltan ${dias} días para el evento`;
}

export function getCambioEstadoActorLabel(compra: Compra, quienId: number): "Organizador" | "Usuario" {
  return quienId === compra.evento.organizador.id ? "Organizador" : "Usuario";
}

export function getInitials(nombre: string, apellido = ""): string {
  const a = (nombre || "").trim().charAt(0).toUpperCase();
  const b = (apellido || "").trim().charAt(0).toUpperCase();
  return `${a}${b}` || "U";
}

export function extractErrorMessage(error: unknown, fallback = "Ocurrió un error inesperado"): string {
  if (error instanceof ApiError && error.status === 401) {
    return SESSION_EXPIRED_MESSAGE;
  }
  if (error instanceof Error && error.message.trim() !== "") {
    if (/token/i.test(error.message)) {
      return SESSION_EXPIRED_MESSAGE;
    }
    return error.message;
  }
  return fallback;
}
