import { apiRequest, buildQueryString } from "./api";
import type {
  Compra,
  CrearCompraPayload,
  EnviarMensajePayload,
  EstadoCompraType,
  ListarComprasParams,
  Mensaje,
} from "@/types/api";

export const compraService = {
  listar(params: ListarComprasParams = {}, signal?: AbortSignal): Promise<Compra[]> {
    const qs = buildQueryString({
      eventoId: params.eventoId,
      estado: params.estado,
      soloFuturos: params.soloFuturos,
    });
    return apiRequest<Compra[]>(`/compras${qs}`, { signal });
  },

  obtenerPorId(id: number, signal?: AbortSignal): Promise<Compra> {
    return apiRequest<Compra>(`/compras/${id}`, { signal });
  },

  crear(payload: CrearCompraPayload): Promise<Compra> {
    return apiRequest<Compra>("/compras", {
      method: "POST",
      body: payload,
    });
  },

  actualizarEstado(
    compraId: number,
    estado: Extract<EstadoCompraType, "CONFIRMADA" | "UTILIZADA" | "REEMBOLSADA">
  ): Promise<Compra> {
    return apiRequest<Compra>(`/compras/${compraId}/estado`, {
      method: "PATCH",
      body: { estado },
    });
  },

  cancelar(compraId: number): Promise<Compra> {
    return apiRequest<Compra>(`/compras/${compraId}/cancelar`, {
      method: "POST",
      body: {},
    });
  },

  reembolsar(compraId: number): Promise<Compra> {
    return apiRequest<Compra>(`/compras/${compraId}/reembolsar`, {
      method: "POST",
      body: {},
    });
  },

  agregarMensaje(
    compraId: number,
    payload: EnviarMensajePayload
  ): Promise<{ mensaje: Mensaje; compra: Compra }> {
    return apiRequest<{ mensaje: Mensaje; compra: Compra }>(`/compras/${compraId}/mensajes`, {
      method: "POST",
      body: payload,
    });
  },
};
