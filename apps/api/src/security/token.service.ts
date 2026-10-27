import jwt, { type SignOptions } from "jsonwebtoken";

const ISSUER = "filo-barberia";
const ALGORITHM = "HS256";

export interface TokenPayload {
  sub: number;
  email: string;
  name: string;
}

export class TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: SignOptions["expiresIn"]
  ) {}

  sign(payload: TokenPayload): string {
    return jwt.sign({ email: payload.email, name: payload.name }, this.secret, {
      subject: String(payload.sub),
      issuer: ISSUER,
      algorithm: ALGORITHM,
      expiresIn: this.expiresIn
    });
  }

  verify(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret, { issuer: ISSUER, algorithms: [ALGORITHM] });
      if (typeof decoded === "string" || !decoded.sub) return null;
      return { sub: Number(decoded.sub), email: String(decoded.email), name: String(decoded.name) };
    } catch {
      return null;
    }
  }
}
