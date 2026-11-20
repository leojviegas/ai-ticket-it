import { validateSchema, validateIdParam } from "../schemas/validator.js";
import {
  crearCompraSchema,
  listarComprasQuerySchema,
  obtenerCompraQuerySchema,
  actualizarEstadoCompraSchema,
  accionCompraUsuarioSchema,
  agregarMensajeSchema,
} from "../schemas/compraSchemas.js";

export class CompraController {
  constructor(compraService) {
    this.compraService = compraService;
  }

  crear = (req, res) => {
    const datos = validateSchema(crearCompraSchema, req.body);
    const compra = this.compraService.crearCompra(datos);
    res.status(201).json(compra);
  };

  listar = (req, res) => {
    const filtros = validateSchema(listarComprasQuerySchema, req.query);
    const compras = this.compraService.listarCompras(filtros);
    res.json(compras);
  };

  obtenerPorId = (req, res) => {
    const id = validateIdParam(req.params);
    const filtros = validateSchema(obtenerCompraQuerySchema, req.query);
    const compra = this.compraService.obtenerCompraPorId(id, filtros);
    res.json(compra);
  };

  actualizarEstado = (req, res) => {
    const id = validateIdParam(req.params);
    const datos = validateSchema(actualizarEstadoCompraSchema, req.body);
    const compra = this.compraService.actualizarEstado(id, datos);
    res.json(compra);
  };

  cancelar = (req, res) => {
    const id = validateIdParam(req.params);
    const datos = validateSchema(accionCompraUsuarioSchema, req.body);
    const compra = this.compraService.cancelarCompra(id, datos);
    res.json(compra);
  };

  reembolsar = (req, res) => {
    const id = validateIdParam(req.params);
    const datos = validateSchema(accionCompraUsuarioSchema, req.body);
    const compra = this.compraService.reembolsarCompra(id, datos);
    res.json(compra);
  };

  agregarMensaje = (req, res) => {
    const id = validateIdParam(req.params);
    const datos = validateSchema(agregarMensajeSchema, req.body);
    const resultado = this.compraService.agregarMensaje(id, datos);
    res.status(201).json(resultado);
  };
}
