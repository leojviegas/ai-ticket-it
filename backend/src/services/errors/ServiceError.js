export class ServiceError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }
}

export class NotFoundError extends ServiceError {}

export class ConflictError extends ServiceError {}

export class BusinessRuleError extends ServiceError {}

export class ForbiddenError extends ServiceError {}
