export type LeaderboardPeriod = "today" | "week" | "month";

export type TrendBucket = {
  bucket: string;
  tokens: number;
  requests: number;
};

export type LeaderboardRow = {
  rank: number;
  userId: string;
  displayName: string;
  tokens: number;
  requests: number;
  tokenShare: number;
  averageTokensPerRequest: number;
  activeBucketCount: number;
  latestBucketTokens: number;
  trend: TrendBucket[];
  rankDelta?: number;
};

export type LeaderboardSnapshot = {
  period: LeaderboardPeriod;
  generatedAt: string;
  timezone: string;
  totals: {
    tokens: number;
    requests: number;
    activeUsers: number;
  };
  rows: LeaderboardRow[];
};

export type LeaderboardError = {
  error: string;
  message: string;
};

export type LeaderboardResponse = LeaderboardSnapshot | LeaderboardError;
