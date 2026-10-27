import type { Request, Response } from "express";
import { loginSchema } from "../dto/auth.dto.js";
import { parse } from "../middleware/validate.js";
import type { AuthService } from "../services/auth.service.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = parse(loginSchema, req.body);
    res.json({ data: await this.authService.login(email, password) });
  };

  me = (_req: Request, res: Response): void => {
    res.json({ data: res.locals.admin });
  };
}
