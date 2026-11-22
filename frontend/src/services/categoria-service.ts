import { apiRequest } from "./api";
import type { Categoria } from "@/types/api";

export const categoriaService = {
  listar(signal?: AbortSignal): Promise<Categoria[]> {
    return apiRequest<Categoria[]>("/categorias", { signal });
  },
};
