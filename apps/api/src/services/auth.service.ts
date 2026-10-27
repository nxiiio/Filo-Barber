import type { LoginResponse } from "../dto/auth.dto.js";
import { UnauthorizedException } from "../exceptions/app-error.js";
import type { AdminUserRepository } from "../repositories/admin-user.repository.js";
import type { PasswordService } from "../security/password.service.js";
import type { TokenPayload, TokenService } from "../security/token.service.js";

export class AuthService {
  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService
  ) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const admin = await this.adminUserRepository.findByEmailWithPassword(email.trim().toLowerCase());
    const valid = await this.passwordService.verify(password, admin?.passwordHash);

    if (!admin || !valid) throw new UnauthorizedException();

    const token = this.tokenService.sign({ sub: admin.id, email: admin.email, name: admin.name });
    return { token, admin: { id: admin.id, email: admin.email, name: admin.name } };
  }

  authenticate(token: string): TokenPayload {
    const payload = this.tokenService.verify(token);
    if (!payload) throw new UnauthorizedException("Sesión inválida o expirada");
    return payload;
  }
}
