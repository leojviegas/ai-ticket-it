import { BaseMemoryRepository } from "./BaseMemoryRepository.js";

export class CompraRepository extends BaseMemoryRepository {
  constructor() {
    super("Compra");
  }

  findByCompradorId(compradorId) {
    const id = Number(compradorId);
    return this.findAll().filter((compra) => compra.comprador.id === id);
  }

  findByEventoId(eventoId) {
    const id = Number(eventoId);
    return this.findAll().filter((compra) => compra.evento.id === id);
  }

  findByCompradorYEvento(compradorId, eventoId) {
    const cId = Number(compradorId);
    const eId = Number(eventoId);
    return this.findAll().filter(
      (compra) => compra.comprador.id === cId && compra.evento.id === eId
    );
  }
}
