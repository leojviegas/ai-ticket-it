import { apiRequest } from "./api";
import type { CrearReseniaPayload, Resenia } from "@/types/api";

export const reseniaService = {
  crear(payload: CrearReseniaPayload): Promise<Resenia> {
    return apiRequest<Resenia>("/resenias", {
      method: "POST",
      body: payload,
    });
  },
};
