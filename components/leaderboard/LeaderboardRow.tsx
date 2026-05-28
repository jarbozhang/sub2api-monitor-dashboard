import type { LeaderboardRow as LeaderboardRowType } from "@/types/leaderboard";
import { formatCompactNumber, formatInteger } from "@/lib/formatting";
import { Sparkline } from "@/components/leaderboard/Sparkline";

type LeaderboardRowProps = {
  row: LeaderboardRowType;
};

export function LeaderboardRow({ row }: LeaderboardRowProps) {
  const isHourly = row.trend.some((bucket) => bucket.bucket.includes(":"));
  const activeUnit = isHourly ? "h" : "d";
  const rankTone = getRankTone(row.rank);
  const rowRankClass = rankTone ? ` rank-${row.rank}` : "";

  return (
    <li className={`leaderboard-row${rowRankClass}`}>
      <div className={rankTone ? `rank-cell rank-cell-${rankTone.tone}` : "rank-cell"}>
        {rankTone ? (
          <div className="podium-badge" aria-label={`${rankTone.title}，第 ${row.rank} 名`}>
            <span className="rank-aura" aria-hidden="true" />
            <span className="rank-icon" aria-hidden="true">
              {rankTone.icon === "crown" ? <CrownIcon /> : <MedalIcon />}
            </span>
            <span className="rank-copy">
              <span aria-hidden="true">#{row.rank}</span>
              <strong>{rankTone.title}</strong>
            </span>
          </div>
        ) : (
          <span>#{row.rank}</span>
        )}
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

function CrownIcon() {
  return (
    <svg viewBox="0 0 64 48" role="img" focusable="false">
      <path d="M8 17 20 29 32 8l12 21 12-12-6 25H14L8 17Z" />
      <path d="M15 42h34" />
      <circle cx="8" cy="17" r="4" />
      <circle cx="32" cy="8" r="4" />
      <circle cx="56" cy="17" r="4" />
    </svg>
  );
}

function MedalIcon() {
  return (
    <svg viewBox="0 0 56 56" role="img" focusable="false">
      <path d="M17 4h22l-8 18h-6L17 4Z" />
      <circle cx="28" cy="34" r="16" />
      <path d="M22 34h12M28 28v12" />
    </svg>
  );
}

function getRankTone(rank: number) {
  if (rank === 1) {
    return {
      tone: "gold",
      icon: "crown",
      title: "冠军",
    };
  }

  if (rank === 2) {
    return {
      tone: "silver",
      icon: "medal",
      title: "亚军",
    };
  }

  if (rank === 3) {
    return {
      tone: "bronze",
      icon: "medal",
      title: "季军",
    };
  }

  return null;
}
