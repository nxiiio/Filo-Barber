export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "SLOT_UNAVAILABLE"
  | "OUTSIDE_BUSINESS_HOURS"
  | "BOOKING_IN_PAST"
  | "BOOKING_LIMIT_REACHED"
  | "BOOKING_TOO_FAR"
  | "ALREADY_CANCELLED"
  | "INACTIVE_RESOURCE";

export interface FieldError {
  field: string;
  message: string;
}

export class BusinessException extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string
  ) {
    super(message);
    this.name = "BusinessException";
  }
}

export class NotFoundException extends BusinessException {
  constructor(resource: string) {
    super("NOT_FOUND", `${resource} no encontrado`);
    this.name = "NotFoundException";
  }
}

export class UnauthorizedException extends BusinessException {
  constructor(message = "Credenciales inválidas") {
    super("UNAUTHORIZED", message);
    this.name = "UnauthorizedException";
  }
}

export class ValidationException extends BusinessException {
  constructor(
    message: string,
    readonly details: FieldError[] = []
  ) {
    super("VALIDATION_ERROR", message);
    this.name = "ValidationException";
  }
}
