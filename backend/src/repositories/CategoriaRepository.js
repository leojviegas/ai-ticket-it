import { BaseMemoryRepository } from "./BaseMemoryRepository.js";

export class CategoriaRepository extends BaseMemoryRepository {
  constructor() {
    super("Categoría");
  }
}
