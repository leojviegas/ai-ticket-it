import Constants from "expo-constants";
import { Platform } from "react-native";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export const SESSION_EXPIRED_MESSAGE =
  "Tu sesión venció. Volvé a iniciar sesión para continuar.";

let currentToken: string | null = null;

type UnauthorizedHandler = (message?: string) => void;
let onUnauthorizedHandler: UnauthorizedHandler | null = null;

export function setApiAuthToken(token: string | null): void {
  currentToken = token;
}

export function setOnUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorizedHandler = handler;
}

function resolveApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  if (Platform.OS !== "web") {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const host = hostUri.split(":")[0];
      if (host) {
        return `http://${host}:3000/api`;
      }
    }
    if (Platform.OS === "android") {
      return "http://10.0.2.2:3000/api";
    }
  }

  return "http://localhost:3000/api";
}

export const API_BASE_URL = resolveApiBaseUrl();

export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.append(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  skipUnauthorizedHandler?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, signal, skipUnauthorizedHandler = false } = options;
  const authToken = token !== undefined ? token : currentToken;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
    throw new ApiError(
      `No se pudo conectar con el servidor (${API_BASE_URL}). Verificá que el backend esté corriendo.`,
      0
    );
  }

  const rawText = await response.text();
  let parsed: any = null;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const isLoginOrRegister =
      path.startsWith("/auth/login") || path.startsWith("/auth/register");
    const isSessionExpired = response.status === 401 && !isLoginOrRegister;
    const msg = isSessionExpired
      ? SESSION_EXPIRED_MESSAGE
      : parsed?.error ||
        parsed?.message ||
        `Error HTTP ${response.status} al consultar ${path}`;
    if (isSessionExpired && !skipUnauthorizedHandler) {
      onUnauthorizedHandler?.(SESSION_EXPIRED_MESSAGE);
    }
    throw new ApiError(msg, response.status, parsed?.details ?? null);
  }

  return parsed as T;
}
