import type { LeaderboardPeriod } from "@/types/leaderboard";

export type TimeWindow = {
  period: LeaderboardPeriod;
  startDate: string;
  endDate: string;
  granularity: "hour" | "day";
  expectedBuckets: string[];
};

function dateFormatter(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function dateParts(date: Date, timezone: string) {
  const parts = dateFormatter(timezone).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
}

function toDateKey(date: Date, timezone: string): string {
  return dateFormatter(timezone).format(date);
}

function utcDateFromDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(dateKey: string, days: number): string {
  const date = utcDateFromDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function hourFormatter(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  });
}

export function buildTimeWindow(
  period: LeaderboardPeriod,
  timezone: string,
  now = new Date(),
): TimeWindow {
  const today = toDateKey(now, timezone);
  const endDate = today;

  if (period === "today") {
    const hour = Number(hourFormatter(timezone).format(now));
    return {
      period,
      startDate: today,
      endDate,
      granularity: "hour",
      expectedBuckets: Array.from({ length: hour + 1 }, (_, index) => {
        return `${today} ${String(index).padStart(2, "0")}:00`;
      }),
    };
  }

  const dayCount = period === "week" ? 7 : 30;
  const startDate = addDays(today, -(dayCount - 1));

  return {
    period,
    startDate,
    endDate,
    granularity: "day",
    expectedBuckets: Array.from({ length: dayCount }, (_, index) => {
      return addDays(startDate, index);
    }),
  };
}

export function getCurrentDateParts(timezone: string, now = new Date()) {
  return dateParts(now, timezone);
}
