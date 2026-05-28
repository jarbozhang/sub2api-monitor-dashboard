import type { LeaderboardSnapshot } from "@/types/leaderboard";
import { formatCompactNumber, formatInteger, formatTime } from "@/lib/formatting";
import { getPeriodLabel } from "@/components/leaderboard/PeriodTicker";

type MetricHeaderProps = {
  snapshot: LeaderboardSnapshot | null;
  period: LeaderboardSnapshot["period"];
  isRefreshing: boolean;
  failureCount: number;
  lastUpdatedAt: string | null;
  timezone: string;
};

export function MetricHeader({
  snapshot,
  period,
  isRefreshing,
  failureCount,
  lastUpdatedAt,
  timezone,
}: MetricHeaderProps) {
  return (
    <header className="metric-header">
      <div className="identity">
        <span className="live-dot" aria-hidden="true" />
        <div>
          <p>Sub2API Monitor</p>
          <h1>Token 消耗排行榜</h1>
        </div>
      </div>

      <div className="metrics-grid" aria-label="总体指标">
        <Metric label="周期" value={getPeriodLabel(period)} />
        <Metric label="Token" value={formatCompactNumber(snapshot?.totals.tokens ?? 0)} />
        <Metric label="请求" value={formatInteger(snapshot?.totals.requests ?? 0)} />
        <Metric label="活跃用户" value={formatInteger(snapshot?.totals.activeUsers ?? 0)} />
        <Metric
          label={failureCount > 0 ? `失败 ${failureCount} 次` : isRefreshing ? "刷新中" : "已同步"}
          value={lastUpdatedAt ? formatTime(lastUpdatedAt, timezone) : "--:--:--"}
          tone={failureCount > 0 ? "danger" : isRefreshing ? "warn" : "ok"}
        />
      </div>
    </header>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "danger";
}) {
  return (
    <div className={tone ? `metric metric-${tone}` : "metric"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
