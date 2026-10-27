const clp = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export function formatClp(value: number): string {
  return clp.format(value);
}

function toUtcDate(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

const longDate = new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const weekdayShort = new Intl.DateTimeFormat("es-CL", { weekday: "short", timeZone: "UTC" });
const monthShort = new Intl.DateTimeFormat("es-CL", { month: "short", timeZone: "UTC" });

export function formatLongDate(date: string): string {
  const text = longDate.format(toUtcDate(date));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function dayParts(date: string): { weekday: string; day: number; month: string } {
  const value = toUtcDate(date);
  return {
    weekday: weekdayShort.format(value).replace(".", ""),
    day: value.getUTCDate(),
    month: monthShort.format(value).replace(".", "")
  };
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^56/, "").slice(0, 9);
  if (digits.length <= 1) return digits;
  if (digits.length <= 5) return `${digits[0]} ${digits.slice(1)}`;
  return `${digits[0]} ${digits.slice(1, 5)} ${digits.slice(5)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
