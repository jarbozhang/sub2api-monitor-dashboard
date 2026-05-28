import type { LeaderboardPeriod } from "@/types/leaderboard";

const LABELS: Record<LeaderboardPeriod, string> = {
  today: "今日",
  week: "近 7 天",
  month: "近 30 天",
};

type PeriodTickerProps = {
  period: LeaderboardPeriod;
  periods: LeaderboardPeriod[];
  seconds: number;
  autoRotate: boolean;
};

export function PeriodTicker({ period, periods, seconds, autoRotate }: PeriodTickerProps) {
  return (
    <div className="period-ticker" aria-label="当前周期">
      {periods.map((item) => (
        <div
          className={item === period ? "period-chip period-chip-active" : "period-chip"}
          key={item}
        >
          <span>{LABELS[item]}</span>
          {item === period && autoRotate ? (
            <i style={{ animationDuration: `${seconds}s` }} aria-hidden="true" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function getPeriodLabel(period: LeaderboardPeriod) {
  return LABELS[period];
}
