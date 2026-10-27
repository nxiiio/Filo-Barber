import bcrypt from "bcryptjs";

const COST = 10;
const TIMING_SAFE_DUMMY_HASH = bcrypt.hashSync("timing-safe-placeholder", COST);

export class PasswordService {
  hash(plain: string): string {
    return bcrypt.hashSync(plain, COST);
  }

  async verify(plain: string, hash: string | undefined): Promise<boolean> {
    const matches = await bcrypt.compare(plain, hash ?? TIMING_SAFE_DUMMY_HASH);
    return hash !== undefined && matches;
  }
}
