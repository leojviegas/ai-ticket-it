export class RepositoryError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }
}

export class EntityNotFoundError extends RepositoryError {}

export class DuplicateEntityError extends RepositoryError {}
