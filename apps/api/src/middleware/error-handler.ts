import type { ErrorRequestHandler, RequestHandler } from "express";
import { BusinessException, ValidationException, type ErrorCode } from "../exceptions/app-error.js";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  SLOT_UNAVAILABLE: 409,
  OUTSIDE_BUSINESS_HOURS: 422,
  BOOKING_IN_PAST: 422,
  BOOKING_TOO_FAR: 422,
  ALREADY_CANCELLED: 409,
  INACTIVE_RESOURCE: 422
};

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Recurso no encontrado" } });
};

export function createErrorHandler(logErrors: boolean): ErrorRequestHandler {
  return (error, _req, res, _next) => {
    if (error instanceof ValidationException) {
      res.status(400).json({ error: { code: error.code, message: error.message, details: error.details } });
      return;
    }

    if (error instanceof BusinessException) {
      res.status(STATUS_BY_CODE[error.code]).json({ error: { code: error.code, message: error.message } });
      return;
    }

    if (error instanceof SyntaxError && "body" in error) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "El cuerpo de la solicitud no es JSON válido" } });
      return;
    }

    if (logErrors) console.error(error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Ocurrió un error inesperado" } });
  };
}
