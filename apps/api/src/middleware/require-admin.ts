import type { RequestHandler } from "express";
import { UnauthorizedException } from "../exceptions/app-error.js";
import type { AuthService } from "../services/auth.service.js";

export function requireAdmin(authService: AuthService): RequestHandler {
  return (req, res, next) => {
    const [scheme, token] = req.headers.authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) throw new UnauthorizedException("Debes iniciar sesión");

    res.locals.admin = authService.authenticate(token);
    next();
  };
}
