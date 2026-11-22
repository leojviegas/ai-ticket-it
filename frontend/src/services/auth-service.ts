import { apiRequest } from "./api";
import type { AuthResponse, Usuario } from "@/types/api";

export const authService = {
  login(email: string, password: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  },

  register(datos: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    return apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: datos,
    });
  },

  me(token?: string): Promise<Usuario> {
    return apiRequest<Usuario>("/auth/me", { token });
  },
};
