export class ControllerError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }
}

export class RequestValidationError extends ControllerError {}
