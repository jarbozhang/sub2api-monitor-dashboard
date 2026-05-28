import { NextResponse } from "next/server";
import type { LeaderboardPeriod } from "@/types/leaderboard";
import { getPublicRuntimeConfig } from "@/lib/env";
import { Sub2ApiError } from "@/lib/sub2api/client";
import { fetchLeaderboardSnapshot } from "@/lib/sub2api/leaderboard";

export const dynamic = "force-dynamic";

const PERIODS = new Set<LeaderboardPeriod>(["today", "week", "month"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const period = url.searchParams.get("period") ?? getPublicRuntimeConfig().defaultPeriod;
  const limit = parseLimit(url.searchParams.get("limit"));

  if (!PERIODS.has(period as LeaderboardPeriod)) {
    return NextResponse.json(
      {
        error: "INVALID_PERIOD",
        message: "period must be today, week, or month",
      },
      { status: 400 },
    );
  }

  try {
    const snapshot = await fetchLeaderboardSnapshot({
      period: period as LeaderboardPeriod,
      limit,
    });

    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Sub2ApiError) {
      return NextResponse.json(
        {
          error: "SUB2API_REQUEST_FAILED",
          message: `Sub2API request failed with status ${error.status}`,
        },
        { status: error.status === 401 || error.status === 403 ? 502 : 503 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json(
      {
        error: "SERVER_CONFIGURATION_ERROR",
        message,
      },
      { status: 500 },
    );
  }
}

function parseLimit(raw: string | null): number {
  if (!raw) {
    return 20;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    return 20;
  }

  return Math.min(value, 100);
}
