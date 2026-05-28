import type {
  LeaderboardPeriod,
  LeaderboardRow,
  LeaderboardSnapshot,
  TrendBucket,
} from "@/types/leaderboard";
import { getAppEnv } from "@/lib/env";
import { Sub2ApiClient } from "@/lib/sub2api/client";
import { buildTimeWindow } from "@/lib/sub2api/time-windows";

type RankingEntry = {
  user_id: number | string;
  email?: string;
  requests?: number;
  tokens?: number;
  actual_cost?: number;
};

type TrendEntry = {
  date: string;
  user_id: number | string;
  email?: string;
  username?: string;
  requests?: number;
  tokens?: number;
  cost?: number;
  actual_cost?: number;
};

type RankingPayload = {
  ranking?: RankingEntry[];
};

type TrendPayload = {
  trend?: TrendEntry[];
};

type LeaderboardClient = {
  get<T>(path: string, params: Record<string, string | number | undefined>): Promise<T>;
};

export type FetchLeaderboardOptions = {
  period: LeaderboardPeriod;
  limit: number;
  now?: Date;
  client?: LeaderboardClient;
};

export async function fetchLeaderboardSnapshot({
  period,
  limit,
  now = new Date(),
  client,
}: FetchLeaderboardOptions): Promise<LeaderboardSnapshot> {
  const env = getAppEnv();
  const sub2api =
    client ??
    new Sub2ApiClient({
      baseUrl: env.sub2apiBaseUrl,
      adminApiKey: env.sub2apiAdminApiKey,
    });
  const window = buildTimeWindow(period, env.timezone, now);
  const commonParams = {
    start_date: window.startDate,
    end_date: window.endDate,
    limit,
    timezone: env.timezone,
  };

  const [rankingPayload, trendPayload] = await Promise.all([
    sub2api.get<RankingPayload>("api/v1/admin/dashboard/users-ranking", commonParams),
    sub2api.get<TrendPayload>("api/v1/admin/dashboard/users-trend", {
      ...commonParams,
      granularity: window.granularity,
    }),
  ]);

  const ranking = Array.isArray(rankingPayload.ranking) ? rankingPayload.ranking : [];
  const tokenRanking = [...ranking].sort((left, right) => {
    return (right.tokens ?? 0) - (left.tokens ?? 0) || (right.requests ?? 0) - (left.requests ?? 0);
  });
  const trend = Array.isArray(trendPayload.trend) ? trendPayload.trend : [];
  const trendByUser = groupTrendByUser(trend);
  const totalTokens = tokenRanking.reduce((sum, entry) => sum + (entry.tokens ?? 0), 0);
  const rows = tokenRanking.slice(0, limit).map((entry, index) => {
    const userId = String(entry.user_id);
    const userTrend = trendByUser.get(userId) ?? [];
    const tokens = entry.tokens ?? 0;
    const requests = entry.requests ?? 0;
    const trendBuckets = buildTrendBuckets(window.expectedBuckets, userTrend);
    return {
      rank: index + 1,
      userId,
      displayName: resolveDisplayName(userId, userTrend),
      tokens,
      requests,
      tokenShare: totalTokens > 0 ? tokens / totalTokens : 0,
      averageTokensPerRequest: requests > 0 ? tokens / requests : 0,
      activeBucketCount: trendBuckets.filter((bucket) => bucket.tokens > 0 || bucket.requests > 0)
        .length,
      latestBucketTokens:
        trendBuckets
          .filter((bucket) => bucket.tokens > 0 || bucket.requests > 0)
          .at(-1)?.tokens ?? 0,
      trend: trendBuckets,
    } satisfies LeaderboardRow;
  });

  return {
    period,
    generatedAt: now.toISOString(),
    timezone: env.timezone,
    totals: {
      tokens: rows.reduce((sum, row) => sum + row.tokens, 0),
      requests: rows.reduce((sum, row) => sum + row.requests, 0),
      activeUsers: rows.length,
    },
    rows,
  };
}

export function resolveDisplayName(userId: string, trend: TrendEntry[]): string {
  const username = trend.find((entry) => entry.username?.trim())?.username?.trim();
  if (username) {
    return username;
  }

  return `用户 #${userId.slice(0, 6)}`;
}

export function buildTrendBuckets(
  expectedBuckets: string[],
  trend: TrendEntry[],
): TrendBucket[] {
  const bucketMap = new Map<string, TrendBucket>();

  for (const bucket of expectedBuckets) {
    bucketMap.set(bucket, {
      bucket,
      tokens: 0,
      requests: 0,
    });
  }

  for (const entry of trend) {
    const current =
      bucketMap.get(entry.date) ??
      ({
        bucket: entry.date,
        tokens: 0,
        requests: 0,
      } satisfies TrendBucket);

    current.tokens += entry.tokens ?? 0;
    current.requests += entry.requests ?? 0;
    bucketMap.set(entry.date, current);
  }

  return [...bucketMap.values()].sort((left, right) => left.bucket.localeCompare(right.bucket));
}

function groupTrendByUser(trend: TrendEntry[]) {
  const grouped = new Map<string, TrendEntry[]>();
  for (const entry of trend) {
    const userId = String(entry.user_id);
    const entries = grouped.get(userId) ?? [];
    entries.push(entry);
    grouped.set(userId, entries);
  }

  return grouped;
}
