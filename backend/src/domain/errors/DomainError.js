export class DomainError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }
}

export class DomainValidationError extends DomainError {}

export class InvalidStateTransitionError extends DomainError {}

