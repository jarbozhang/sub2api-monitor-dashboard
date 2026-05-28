import type { LeaderboardPeriod } from "@/types/leaderboard";

export type AppEnv = {
  sub2apiBaseUrl: string;
  sub2apiAdminApiKey: string;
  timezone: string;
  refreshSeconds: number;
  periodRotateSeconds: number;
  autoRotate: boolean;
  defaultPeriod: LeaderboardPeriod;
  pageSeconds: number;
};

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return value;
}

function readBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

function readPeriod(name: string, fallback: LeaderboardPeriod): LeaderboardPeriod {
  const raw = process.env[name];
  if (raw === "today" || raw === "week" || raw === "month") {
    return raw;
  }

  return fallback;
}

export function getAppEnv(): AppEnv {
  const sub2apiBaseUrl = process.env.SUB2API_BASE_URL?.replace(/\/+$/, "");
  const sub2apiAdminApiKey = process.env.SUB2API_ADMIN_API_KEY;

  if (!sub2apiBaseUrl) {
    throw new Error("Missing SUB2API_BASE_URL");
  }

  if (!sub2apiAdminApiKey) {
    throw new Error("Missing SUB2API_ADMIN_API_KEY");
  }

  return {
    sub2apiBaseUrl,
    sub2apiAdminApiKey,
    timezone: process.env.SUB2API_TIMEZONE || "Asia/Shanghai",
    refreshSeconds: readNumber("LEADERBOARD_REFRESH_SECONDS", 60),
    periodRotateSeconds: readNumber("LEADERBOARD_PERIOD_ROTATE_SECONDS", 20),
    autoRotate: readBoolean("LEADERBOARD_AUTO_ROTATE", true),
    defaultPeriod: readPeriod("LEADERBOARD_DEFAULT_PERIOD", "today"),
    pageSeconds: readNumber("LEADERBOARD_PAGE_SECONDS", 12),
  };
}

export function getPublicRuntimeConfig() {
  return {
    timezone: process.env.SUB2API_TIMEZONE || "Asia/Shanghai",
    refreshSeconds: readNumber("LEADERBOARD_REFRESH_SECONDS", 60),
    periodRotateSeconds: readNumber("LEADERBOARD_PERIOD_ROTATE_SECONDS", 20),
    autoRotate: readBoolean("LEADERBOARD_AUTO_ROTATE", true),
    defaultPeriod: readPeriod("LEADERBOARD_DEFAULT_PERIOD", "today"),
    pageSeconds: readNumber("LEADERBOARD_PAGE_SECONDS", 12),
  };
}
