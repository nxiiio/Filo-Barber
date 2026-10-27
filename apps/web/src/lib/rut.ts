export function cleanRut(value: string): string {
  return value.replace(/[^\dkK]/g, "").toUpperCase();
}

export function formatRut(value: string): string {
  const clean = cleanRut(value).slice(0, 9);
  if (clean.length <= 1) return clean;
  const body = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${body}-${clean.slice(-1)}`;
}
