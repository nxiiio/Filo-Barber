export function computeVerifierDigit(body: string): string {
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  if (remainder === 11) return "0";
  if (remainder === 10) return "K";
  return String(remainder);
}

export function normalizeRut(value: string): string {
  const clean = value.replace(/[.\s]/g, "").toUpperCase();
  const match = /^0*(\d+)-?([\dK])$/.exec(clean);
  return match ? `${match[1]}-${match[2]}` : clean;
}
