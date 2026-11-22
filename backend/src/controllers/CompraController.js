import { validateSchema, validateIdParam } from "../schemas/validator.js";
import {
  crearCompraSchema,
  listarComprasQuerySchema,
  obtenerCompraQuerySchema,
  actualizarEstadoCompraSchema,
  accionCompraUsuarioSchema,
  agregarMensajeSchema,
} from "../schemas/compraSchemas.js";
import { ForbiddenError } from "../services/errors/ServiceError.js";

function resolverUsuarioAutenticado(req, idInformado, mensajeError) {
  if (idInformado !== undefined && req.user && idInformado !== req.user.id) {
    throw new ForbiddenError(mensajeError);
  }
  return req.user ? req.user.id : idInformado;
}

export class CompraController {
  constructor(compraService) {
    this.compraService = compraService;
  }

  crear = (req, res) => {
    const datos = validateSchema(crearCompraSchema, req.body);
    const compradorId = resolverUsuarioAutenticado(
      req,
      datos.compradorId,
      "No tienes permiso para comprar entradas en nombre de otro usuario"
    );
    const compra = this.compraService.crearCompra({ ...datos, compradorId });
    res.status(201).json(compra);
  };

  listar = (req, res) => {
    const filtros = validateSchema(listarComprasQuerySchema, req.query);
    if (filtros.compradorId !== undefined && req.user && filtros.compradorId !== req.user.id) {
      throw new ForbiddenError("No tienes permiso para consultar las compras de otro usuario");
    }

    if (req.user) {
      if (filtros.eventoId !== undefined && filtros.compradorId === undefined) {
        const comprasEvento = this.compraService.listarCompras({ eventoId: filtros.eventoId });
        const visibles = comprasEvento.filter(
          (c) => c.comprador.id === req.user.id || c.evento.organizador.id === req.user.id
        );
        return res.json(visibles);
      }
      const compras = this.compraService.listarCompras({
        ...filtros,
        compradorId: req.user.id,
      });
      return res.json(compras);
    }

    const compras = this.compraService.listarCompras(filtros);
    return res.json(compras);
  };

  obtenerPorId = (req, res) => {
    const id = validateIdParam(req.params);
    const filtros = validateSchema(obtenerCompraQuerySchema, req.query);
    const usuarioId = resolverUsuarioAutenticado(
      req,
      filtros.usuarioId,
      "No tienes permiso para consultar una compra en nombre de otro usuario"
    );
    const compra = this.compraService.obtenerCompraPorId(id, { usuarioId });
    res.json(compra);
  };

  actualizarEstado = (req, res) => {
    const id = validateIdParam(req.params);
    const datos = validateSchema(actualizarEstadoCompraSchema, req.body);
    const usuarioId = resolverUsuarioAutenticado(
      req,
      datos.usuarioId,
      "No tienes permiso para actualizar el estado en nombre de otro usuario"
    );
    const compra = this.compraService.actualizarEstado(id, { ...datos, usuarioId });
    res.json(compra);
  };

  cancelar = (req, res) => {
    const id = validateIdParam(req.params);
    const datos = validateSchema(accionCompraUsuarioSchema, req.body ?? {});
    const usuarioId = resolverUsuarioAutenticado(
      req,
      datos.usuarioId,
      "No tienes permiso para cancelar una compra en nombre de otro usuario"
    );
    const compra = this.compraService.cancelarCompra(id, { usuarioId });
    res.json(compra);
  };

  reembolsar = (req, res) => {
    const id = validateIdParam(req.params);
    const datos = validateSchema(accionCompraUsuarioSchema, req.body ?? {});
    const usuarioId = resolverUsuarioAutenticado(
      req,
      datos.usuarioId,
      "No tienes permiso para reembolsar una compra en nombre de otro usuario"
    );
    const compra = this.compraService.reembolsarCompra(id, { usuarioId });
    res.json(compra);
  };

  agregarMensaje = (req, res) => {
    const id = validateIdParam(req.params);
    const datos = validateSchema(agregarMensajeSchema, req.body);
    const usuarioId = resolverUsuarioAutenticado(
      req,
      datos.usuarioId,
      "No tienes permiso para enviar mensajes en nombre de otro usuario"
    );
    const resultado = this.compraService.agregarMensaje(id, { ...datos, usuarioId });
    res.status(201).json(resultado);
  };
}
