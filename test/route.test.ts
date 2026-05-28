import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/sub2api/leaderboard", () => ({
  fetchLeaderboardSnapshot: vi.fn(async () => ({
    period: "today",
    generatedAt: "2026-05-28T00:00:00.000Z",
    timezone: "Asia/Shanghai",
    totals: {
      tokens: 12,
      requests: 3,
      activeUsers: 1,
    },
    rows: [],
  })),
}));

describe("GET /api/leaderboard", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.SUB2API_TIMEZONE = "Asia/Shanghai";
    process.env.LEADERBOARD_DEFAULT_PERIOD = "today";
    process.env.SUB2API_BASE_URL = "http://example.test";
    process.env.SUB2API_ADMIN_API_KEY = "admin-test";
  });

  it("rejects invalid periods", async () => {
    const { GET } = await import("@/app/api/leaderboard/route");
    const response = await GET(new Request("http://local.test/api/leaderboard?period=year"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "INVALID_PERIOD",
    });
  });

  it("returns a snapshot for valid requests", async () => {
    const { GET } = await import("@/app/api/leaderboard/route");
    const response = await GET(new Request("http://local.test/api/leaderboard?period=today"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      period: "today",
      totals: {
        tokens: 12,
      },
    });
  });
});
