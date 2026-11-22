import { BaseMemoryRepository } from "./BaseMemoryRepository.js";

export class EventoRepository extends BaseMemoryRepository {
  constructor() {
    super("Evento");
  }

  findByOrganizadorId(organizadorId) {
    const id = Number(organizadorId);
    return this.findAll().filter((evento) => evento.organizador.id === id);
  }
}
