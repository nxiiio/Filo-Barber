export const SLOT_STEP_MINUTES = 30;

export interface OpeningHours {
  open: number;
  close: number;
}

const WEEKDAY_HOURS: OpeningHours = { open: 10 * 60, close: 20 * 60 };
const SATURDAY_HOURS: OpeningHours = { open: 10 * 60, close: 18 * 60 };

export interface TimeRange {
  start: number;
  end: number;
}

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function toTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function dayOfWeek(date: string): number {
  return parseDate(date).getUTCDay();
}

export function daysBetween(from: string, to: string): number {
  const msPerDay = 86_400_000;
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / msPerDay);
}

export function addDays(date: string, days: number): string {
  const result = parseDate(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function openingHoursFor(date: string): OpeningHours | null {
  const weekday = dayOfWeek(date);
  if (weekday === 0) return null;
  if (weekday === 6) return SATURDAY_HOURS;
  return WEEKDAY_HOURS;
}

export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && b.start < a.end;
}

export function isWithinOpeningHours(date: string, range: TimeRange): boolean {
  const hours = openingHoursFor(date);
  if (!hours) return false;
  return range.start >= hours.open && range.end <= hours.close && range.start % SLOT_STEP_MINUTES === 0;
}

export function candidateStarts(date: string, durationMinutes: number): number[] {
  const hours = openingHoursFor(date);
  if (!hours) return [];

  const starts: number[] = [];
  for (let start = hours.open; start + durationMinutes <= hours.close; start += SLOT_STEP_MINUTES) {
    starts.push(start);
  }
  return starts;
}
