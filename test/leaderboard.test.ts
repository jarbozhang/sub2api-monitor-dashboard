import { describe, expect, it } from "vitest";
import {
  buildTrendBuckets,
  fetchLeaderboardSnapshot,
  resolveDisplayName,
} from "@/lib/sub2api/leaderboard";

describe("resolveDisplayName", () => {
  it("uses username from trend entries", () => {
    expect(
      resolveDisplayName("123456789", [
        {
          date: "2026-05-28 01:00",
          user_id: 123456789,
          email: "hidden@example.com",
          username: "operator-a",
          tokens: 100,
          requests: 1,
          actual_cost: 10,
        },
      ]),
    ).toBe("operator-a");
  });

  it("falls back to user id and never email", () => {
    expect(
      resolveDisplayName("abcdef123456", [
        {
          date: "2026-05-28 01:00",
          user_id: "abcdef123456",
          email: "hidden@example.com",
          username: "",
          tokens: 100,
          requests: 1,
          cost: 10,
        },
      ]),
    ).toBe("用户 #abcdef");
  });
});

describe("buildTrendBuckets", () => {
  it("fills missing buckets and ignores cost fields", () => {
    const buckets = buildTrendBuckets(
      ["2026-05-28 00:00", "2026-05-28 01:00"],
      [
        {
          date: "2026-05-28 01:00",
          user_id: 2,
          email: "hidden@example.com",
          username: "operator",
          tokens: 25,
          requests: 3,
          actual_cost: 99,
        },
      ],
    );

    expect(buckets).toEqual([
      { bucket: "2026-05-28 00:00", tokens: 0, requests: 0 },
      { bucket: "2026-05-28 01:00", tokens: 25, requests: 3 },
    ]);
    expect(JSON.stringify(buckets)).not.toContain("hidden@example.com");
    expect(JSON.stringify(buckets)).not.toContain("actual_cost");
  });
});

describe("fetchLeaderboardSnapshot", () => {
  it("sorts rows by token usage and excludes email and cost fields", async () => {
    process.env.SUB2API_BASE_URL = "http://example.test";
    process.env.SUB2API_ADMIN_API_KEY = "admin-test";
    process.env.SUB2API_TIMEZONE = "Asia/Shanghai";

    const client = {
      get: async <T,>(path: string): Promise<T> => {
        if (path.includes("users-ranking")) {
          return {
            ranking: [
              {
                user_id: 1,
                email: "one@example.com",
                tokens: 100,
                requests: 8,
                actual_cost: 8,
              },
              {
                user_id: 2,
                email: "two@example.com",
                tokens: 300,
                requests: 5,
                actual_cost: 5,
              },
            ],
          } as T;
        }

        return {
          trend: [
            {
              date: "2026-05-28 00:00",
              user_id: 1,
              username: "one",
              tokens: 100,
              requests: 8,
              actual_cost: 8,
            },
            {
              date: "2026-05-28 00:00",
              user_id: 2,
              username: "two",
              tokens: 300,
              requests: 5,
              actual_cost: 5,
            },
          ],
        } as T;
      },
    };

    const snapshot = await fetchLeaderboardSnapshot({
      period: "today",
      limit: 2,
      now: new Date("2026-05-28T00:30:00.000Z"),
      client,
    });

    expect(snapshot.rows.map((row) => row.displayName)).toEqual(["two", "one"]);
    expect(snapshot.rows.map((row) => row.tokens)).toEqual([300, 100]);
    expect(snapshot.rows[0]).toMatchObject({
      tokenShare: 0.75,
      averageTokensPerRequest: 60,
      activeBucketCount: 1,
      latestBucketTokens: 300,
    });
    expect(JSON.stringify(snapshot)).not.toContain("@");
    expect(JSON.stringify(snapshot)).not.toContain("actual_cost");
  });
});
