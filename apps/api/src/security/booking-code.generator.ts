import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LENGTH = 6;

export interface CodeGenerator {
  generate(): string;
}

export class BookingCodeGenerator implements CodeGenerator {
  generate(): string {
    return Array.from({ length: LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  }
}
