import { apiRequest, buildQueryString } from "./api";
import type { Conversacion, MensajeListado } from "@/types/api";

export const mensajeService = {
  listar(
    params: {
      compraId?: number;
      conUsuarioId?: number;
      remitenteId?: number;
      destinatarioId?: number;
    } = {},
    signal?: AbortSignal
  ): Promise<MensajeListado[]> {
    const qs = buildQueryString(params);
    return apiRequest<MensajeListado[]>(`/mensajes${qs}`, { signal });
  },

  listarConversaciones(incluirVacias = false, signal?: AbortSignal): Promise<Conversacion[]> {
    const qs = buildQueryString({ incluirVacias });
    return apiRequest<Conversacion[]>(`/mensajes/conversaciones${qs}`, { signal });
  },
};
