export const TIME_ZONE = "America/Santiago";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

export function todayInShop(now: Date = new Date()): string {
  return dateFormatter.format(now);
}

export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function isClosedDay(date: string): boolean {
  return new Date(`${date}T12:00:00Z`).getUTCDay() === 0;
}

export function upcomingDays(from: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addDays(from, index));
}

export function firstOpenDay(from: string): string {
  let date = from;
  while (isClosedDay(date)) date = addDays(date, 1);
  return date;
}
