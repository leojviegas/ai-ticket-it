import { validateSchema } from "../schemas/validator.js";
import {
  crearCompraSchema,
  listarComprasQuerySchema,
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
    const compra = this.compraService.obtenerCompraPorId(req.params.id);
    res.json(compra);
  };

  actualizarEstado = (req, res) => {
    const datos = validateSchema(actualizarEstadoCompraSchema, req.body);
    const compra = this.compraService.actualizarEstado(req.params.id, datos);
    res.json(compra);
  };

  cancelar = (req, res) => {
    const datos = validateSchema(accionCompraUsuarioSchema, req.body);
    const compra = this.compraService.cancelarCompra(req.params.id, datos);
    res.json(compra);
  };

  reembolsar = (req, res) => {
    const datos = validateSchema(accionCompraUsuarioSchema, req.body);
    const compra = this.compraService.reembolsarCompra(req.params.id, datos);
    res.json(compra);
  };

  agregarMensaje = (req, res) => {
    const datos = validateSchema(agregarMensajeSchema, req.body);
    const resultado = this.compraService.agregarMensaje(req.params.id, datos);
    res.status(201).json(resultado);
  };
}
