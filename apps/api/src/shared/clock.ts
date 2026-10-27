export interface LocalDateTime {
  date: string;
  minutes: number;
}

export interface Clock {
  now(): LocalDateTime;
  timestamp(): string;
}

export class ZonedClock implements Clock {
  private readonly formatter: Intl.DateTimeFormat;

  constructor(timeZone: string) {
    this.formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    });
  }

  now(): LocalDateTime {
    const parts = Object.fromEntries(
      this.formatter.formatToParts(new Date()).map((part) => [part.type, part.value])
    );
    return {
      date: `${parts.year}-${parts.month}-${parts.day}`,
      minutes: Number(parts.hour) * 60 + Number(parts.minute)
    };
  }

  timestamp(): string {
    return new Date().toISOString();
  }
}
