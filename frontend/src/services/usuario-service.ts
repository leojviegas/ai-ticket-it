import { apiRequest } from "./api";
import type { Usuario, UsuarioPerfil } from "@/types/api";

export const usuarioService = {
  obtenerPorId(id: number, signal?: AbortSignal): Promise<UsuarioPerfil> {
    return apiRequest<UsuarioPerfil>(`/usuarios/${id}`, { signal });
  },

  toggleFavorito(
    usuarioId: number,
    eventoId: number
  ): Promise<{ esFavorito: boolean; favoritosIds: number[]; usuario: Usuario }> {
    return apiRequest<{ esFavorito: boolean; favoritosIds: number[]; usuario: Usuario }>(
      `/usuarios/${usuarioId}/favoritos`,
      {
        method: "POST",
        body: { eventoId },
      }
    );
  },
};
