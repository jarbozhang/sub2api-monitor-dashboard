import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeaderboardScreen } from "@/components/leaderboard/LeaderboardScreen";
import type { LeaderboardPeriod, LeaderboardSnapshot } from "@/types/leaderboard";

function buildSnapshot(period: LeaderboardPeriod, rowCount: number): LeaderboardSnapshot {
  return {
    period,
    generatedAt: "2026-05-28T00:00:00.000Z",
    timezone: "Asia/Shanghai",
    totals: {
      tokens: rowCount,
      requests: rowCount,
      activeUsers: rowCount,
    },
    rows: Array.from({ length: rowCount }, (_, index) => ({
      rank: index + 1,
      userId: `${period}-${index + 1}`,
      displayName: `${period}-user-${index + 1}`,
      tokens: rowCount - index,
      requests: 1,
      tokenShare: 1 / rowCount,
      averageTokensPerRequest: rowCount - index,
      activeBucketCount: 1,
      latestBucketTokens: rowCount - index,
      trend: [{ bucket: "2026-05-28", tokens: rowCount - index, requests: 1 }],
    })),
  };
}

describe("LeaderboardScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const snapshots = {
      today: buildSnapshot("today", 18),
      week: buildSnapshot("week", 18),
      month: buildSnapshot("month", 18),
    };

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = new URL(String(input), "http://local.test");
      const period = (url.searchParams.get("period") ?? "today") as LeaderboardPeriod;

      return new Response(JSON.stringify(snapshots[period]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("restarts page rotation when the active period changes", async () => {
    render(
      <LeaderboardScreen
        config={{
          timezone: "Asia/Shanghai",
          refreshSeconds: 60,
          periodRotateSeconds: 20,
          autoRotate: true,
          defaultPeriod: "today",
          pageSeconds: 12,
        }}
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(screen.getByText("today-user-1")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(12_000);
    });
    expect(screen.getByText("today-user-11")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByText("week-user-1")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(12_000);
    });
    expect(screen.getByText("week-user-11")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(7_900);
    });
    expect(screen.getByText("week-user-11")).toBeInTheDocument();
    expect(screen.queryByText("week-user-1")).not.toBeInTheDocument();
  });
});
