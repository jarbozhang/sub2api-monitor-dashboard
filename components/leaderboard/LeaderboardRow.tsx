import type { LeaderboardRow as LeaderboardRowType } from "@/types/leaderboard";
import { formatCompactNumber, formatInteger } from "@/lib/formatting";
import { Sparkline } from "@/components/leaderboard/Sparkline";

type LeaderboardRowProps = {
  row: LeaderboardRowType;
};

export function LeaderboardRow({ row }: LeaderboardRowProps) {
  const isHourly = row.trend.some((bucket) => bucket.bucket.includes(":"));
  const activeUnit = isHourly ? "h" : "d";

  return (
    <li className={`leaderboard-row rank-${Math.min(row.rank, 3)}`}>
      <div className="rank-cell">
        <span>#{row.rank}</span>
      </div>
      <div className="user-cell">
        <strong>{row.displayName}</strong>
      </div>
      <div className="number-cell">
        <span>Token</span>
        <strong>{formatCompactNumber(row.tokens)}</strong>
      </div>
      <div className="insight-cell" aria-label="派生指标">
        <Insight label="占比" value={formatPercent(row.tokenShare)} />
        <Insight label="单次" value={formatCompactNumber(row.averageTokensPerRequest)} />
        <Insight label="活跃" value={`${row.activeBucketCount}${activeUnit}`} />
        <Insight label="最近" value={formatCompactNumber(row.latestBucketTokens)} />
      </div>
      <div className="number-cell">
        <span>请求</span>
        <strong>{formatInteger(row.requests)}</strong>
      </div>
      <div className="trend-cell">
        <Sparkline trend={row.trend} />
      </div>
    </li>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <span className="insight-pill">
      <i>{label}</i>
      <b>{value}</b>
    </span>
  );
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(value >= 0.1 ? 0 : 1)}%`;
}
