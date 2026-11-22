import { apiRequest, buildQueryString } from "./api";
import type {
  CrearEventoPayload,
  EstadoCompraType,
  Evento,
  EventoDetalle,
  ListarEventosParams,
  PanelEventoResponse,
} from "@/types/api";

export const eventoService = {
  listar(params: ListarEventosParams = {}, signal?: AbortSignal): Promise<Evento[]> {
    const qs = buildQueryString({
      q: params.q,
      categoriaId: params.categoriaId,
      organizadorId: params.organizadorId,
      precioMin: params.precioMin,
      precioMax: params.precioMax,
      soloFuturos: params.soloFuturos,
      ordenarPor: params.ordenarPor,
      orden: params.orden,
    });
    return apiRequest<Evento[]>(`/eventos${qs}`, { signal });
  },

  obtenerDetalle(id: number, signal?: AbortSignal): Promise<EventoDetalle> {
    return apiRequest<EventoDetalle>(`/eventos/${id}`, { signal });
  },

  crear(payload: CrearEventoPayload): Promise<Evento> {
    return apiRequest<Evento>("/eventos", {
      method: "POST",
      body: payload,
    });
  },

  obtenerComprasYDisponibilidad(
    eventoId: number,
    estado?: EstadoCompraType,
    signal?: AbortSignal
  ): Promise<PanelEventoResponse> {
    const qs = buildQueryString({ estado });
    return apiRequest<PanelEventoResponse>(`/eventos/${eventoId}/compras${qs}`, { signal });
  },
};
