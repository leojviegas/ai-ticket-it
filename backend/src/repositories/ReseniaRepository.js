import { BaseMemoryRepository } from "./BaseMemoryRepository.js";

export class ReseniaRepository extends BaseMemoryRepository {
  constructor() {
    super("Reseña");
  }

  findByEventoId(eventoId) {
    const id = Number(eventoId);
    return this.findAll().filter((resenia) => resenia.evento.id === id);
  }

  findByOrganizadorId(organizadorId) {
    const id = Number(organizadorId);
    return this.findAll().filter((resenia) => resenia.evento.organizador.id === id);
  }

  existsByCompradorYEvento(compradorId, eventoId) {
    const cId = Number(compradorId);
    const eId = Number(eventoId);
    return this.findAll().some(
      (resenia) => resenia.comprador.id === cId && resenia.evento.id === eId
    );
  }
}
