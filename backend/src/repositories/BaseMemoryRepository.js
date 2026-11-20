import { EntityNotFoundError } from "./errors/RepositoryError.js";

export class BaseMemoryRepository {
  constructor(entityName) {
    this.entityName = entityName;
    this.items = new Map();
  }

  save(entity) {
    this.items.set(entity.id, entity);
    return entity;
  }

  findById(id) {
    return this.items.get(Number(id)) || null;
  }

  findByIdOrThrow(id) {
    const entity = this.findById(id);
    if (!entity) {
      throw new EntityNotFoundError(`${this.entityName} con id ${id} no encontrado`);
    }
    return entity;
  }

  findAll() {
    return Array.from(this.items.values());
  }

  delete(id) {
    return this.items.delete(Number(id));
  }

  clear() {
    this.items.clear();
  }
}
