"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LeaderboardPeriod, LeaderboardSnapshot } from "@/types/leaderboard";
import { LeaderboardRow } from "@/components/leaderboard/LeaderboardRow";
import { MetricHeader } from "@/components/leaderboard/MetricHeader";
import { PeriodTicker } from "@/components/leaderboard/PeriodTicker";

const PERIODS: LeaderboardPeriod[] = ["today", "week", "month"];
const ROWS_PER_PAGE = 10;

type RuntimeConfig = {
  timezone: string;
  refreshSeconds: number;
  periodRotateSeconds: number;
  autoRotate: boolean;
  defaultPeriod: LeaderboardPeriod;
  pageSeconds: number;
};

type LeaderboardScreenProps = {
  config: RuntimeConfig;
};

export function LeaderboardScreen({ config }: LeaderboardScreenProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>(config.defaultPeriod);
  const [snapshots, setSnapshots] = useState<Partial<Record<LeaderboardPeriod, LeaderboardSnapshot>>>(
    {},
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [failureCount, setFailureCount] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const inFlightRef = useRef(false);

  const snapshot = snapshots[period] ?? null;
  const totalPages = Math.max(1, Math.ceil((snapshot?.rows.length ?? 0) / ROWS_PER_PAGE));
  const visibleRows = useMemo(() => {
    const rows = snapshot?.rows ?? [];
    const start = (pageIndex % totalPages) * ROWS_PER_PAGE;
    return rows.slice(start, start + ROWS_PER_PAGE);
  }, [pageIndex, snapshot?.rows, totalPages]);

  const refresh = useCallback(
    async (targetPeriod: LeaderboardPeriod) => {
      if (inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      setIsRefreshing(true);

      try {
        const response = await fetch(`/api/leaderboard?period=${targetPeriod}&limit=30`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`刷新失败：${response.status}`);
        }

        const nextSnapshot = (await response.json()) as LeaderboardSnapshot;
        setSnapshots((current) => ({
          ...current,
          [targetPeriod]: nextSnapshot,
        }));
        setFailureCount(0);
        setLastUpdatedAt(nextSnapshot.generatedAt);
      } catch {
        setFailureCount((count) => count + 1);
      } finally {
        inFlightRef.current = false;
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refresh(period);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [period, refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }
      refresh(period);
    }, config.refreshSeconds * 1000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refresh(period);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [config.refreshSeconds, period, refresh]);

  useEffect(() => {
    if (!config.autoRotate) {
      return;
    }

    const interval = window.setInterval(() => {
      setPeriod((current) => {
        const index = PERIODS.indexOf(current);
        return PERIODS[(index + 1) % PERIODS.length];
      });
      setPageIndex(0);
    }, config.periodRotateSeconds * 1000);

    return () => window.clearInterval(interval);
  }, [config.autoRotate, config.periodRotateSeconds]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPageIndex((current) => (current + 1) % totalPages);
    }, config.pageSeconds * 1000);

    return () => window.clearInterval(interval);
  }, [config.pageSeconds, totalPages]);

  return (
    <main className="screen-shell">
      <div className="aurora aurora-a" />
      <div className="aurora aurora-b" />

      <MetricHeader
        snapshot={snapshot}
        period={period}
        isRefreshing={isRefreshing}
        failureCount={failureCount}
        lastUpdatedAt={lastUpdatedAt}
        timezone={config.timezone}
      />

      <section className="leaderboard-stage" aria-label="Sub2API token 使用排行">
        <div className="stage-topline">
          <PeriodTicker
            period={period}
            periods={PERIODS}
            seconds={config.periodRotateSeconds}
            autoRotate={config.autoRotate}
          />
          <div className="page-indicator">
            <span>{String(pageIndex + 1).padStart(2, "0")}</span>
            <i />
            <span>{String(totalPages).padStart(2, "0")}</span>
          </div>
        </div>

        <ol className="leaderboard-list">
          {visibleRows.map((row) => (
            <LeaderboardRow key={`${period}-${row.userId}-${row.rank}`} row={row} />
          ))}
        </ol>

        {!snapshot && (
          <div className="empty-state">
            <span className="loader" aria-hidden="true" />
            <strong>正在连接 Sub2API</strong>
            <p>数据到达后会自动进入轮播，无需操作。</p>
          </div>
        )}
      </section>
    </main>
  );
}
