export const EstadoCompra = {
  PENDIENTE: "PENDIENTE",
  CONFIRMADA: "CONFIRMADA",
  UTILIZADA: "UTILIZADA",
  CANCELADA: "CANCELADA",
  REEMBOLSADA: "REEMBOLSADA",
} as const;

export type EstadoCompraType = (typeof EstadoCompra)[keyof typeof EstadoCompra];

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string | null;
  favoritosIds: number[];
  puntajeOrganizador?: number;
  cantidadReseniasOrganizador?: number;
}

export interface TipoEntrada {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  cupo: number;
}

export interface Evento {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: Categoria;
  fecha: string;
  tiposEntrada: TipoEntrada[];
  multimedia: string[];
  organizador: Usuario;
  precioMinimo: number;
  yaOcurrio: boolean;
  puntajeEvento: number;
  cantidadReseniasEvento: number;
  puntajeOrganizador: number;
  cantidadReseniasOrganizador: number;
}

export interface Resenia {
  id: number;
  comprador: Usuario;
  eventoId: number;
  eventoNombre: string;
  detalle: string;
  puntuacion: number;
}

export interface EventoDetalle extends Evento {
  reseniasEvento: Resenia[];
  reseniasOrganizador: Resenia[];
  reseniasEventosAnterioresOrganizador: Resenia[];
}

export interface UsuarioPerfil extends Usuario {
  favoritos: Evento[];
  puntajeOrganizador: number;
  cantidadReseniasOrganizador: number;
  reseniasRecibidas: Resenia[];
  reseniasOrganizador: Resenia[];
  eventosOrganizados: Evento[];
}

export interface CambioEstadoCompra {
  id: number;
  compraId: number;
  estado: EstadoCompraType;
  quien: Usuario;
  fechaHora: string;
}

export type TipoMimeAdjunto =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "application/pdf";

export interface AdjuntoMensaje {
  nombre: string;
  tipoMime: TipoMimeAdjunto;
  contenido: string;
}

export interface Mensaje {
  id: number;
  remitente: Usuario;
  destinatario: Usuario;
  mensaje: string;
  enviado: string;
  adjunto: AdjuntoMensaje | null;
}

export interface MensajeListado extends Mensaje {
  compraId: number;
  eventoId: number;
  eventoNombre: string;
  estadoCompra: EstadoCompraType;
  rolUsuario: "COMPRADOR" | "ORGANIZADOR";
}

export interface Conversacion {
  compraId: number;
  eventoId: number;
  eventoNombre: string;
  eventoFecha: string;
  eventoMultimedia: string[];
  estadoCompra: EstadoCompraType;
  rolUsuario: "COMPRADOR" | "ORGANIZADOR";
  contraparte: Usuario;
  cantidadMensajes: number;
  ultimoMensaje: Mensaje | null;
  mensajes: Mensaje[];
}

export interface Compra {
  id: number;
  comprador: Usuario;
  evento: Evento;
  tipoEntrada: TipoEntrada;
  cantidad: number;
  total: number;
  estado: EstadoCompraType;
  diasParaEvento: number | null;
  mensajes: Mensaje[];
  cambiosEstado: CambioEstadoCompra[];
  yaReseniado: boolean;
}

export interface DisponibilidadTipoEntrada extends TipoEntrada {
  cupoDisponible: number;
  entradasVendidas: number;
  entradasReservadas: number;
}

export interface PanelEventoResponse {
  evento: Evento;
  disponibilidadPorTipo: DisponibilidadTipoEntrada[];
  compras: Compra[];
}

export interface AuthResponse {
  accessToken: string;
  usuario: Usuario;
}

export interface ListarEventosParams {
  q?: string;
  categoriaId?: number;
  organizadorId?: number;
  precioMin?: number;
  precioMax?: number;
  soloFuturos?: boolean;
  ordenarPor?: "precio" | "fecha" | "puntaje";
  orden?: "asc" | "desc";
}

export interface ListarComprasParams {
  eventoId?: number;
  estado?: EstadoCompraType;
  soloFuturos?: boolean;
}

export interface CrearEventoPayload {
  nombre: string;
  descripcion: string;
  categoriaId: number;
  fecha: string;
  multimedia: string[];
  tiposEntrada: {
    nombre: string;
    descripcion: string;
    precio: number;
    cupo: number;
  }[];
}

export interface CrearCompraPayload {
  eventoId: number;
  tipoEntradaId: number;
  cantidad: number;
}

export interface EnviarMensajePayload {
  mensaje?: string;
  adjunto?: AdjuntoMensaje | null;
}

export interface CrearReseniaPayload {
  eventoId: number;
  puntuacion: number;
  detalle: string;
}
