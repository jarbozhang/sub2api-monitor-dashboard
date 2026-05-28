import type { TrendBucket } from "@/types/leaderboard";

type SparklineProps = {
  trend: TrendBucket[];
};

export function Sparkline({ trend }: SparklineProps) {
  const width = 180;
  const height = 44;
  const padding = 4;
  const max = Math.max(...trend.map((point) => point.tokens), 1);
  const points = trend.map((point, index) => {
    const x =
      trend.length === 1
        ? width / 2
        : padding + (index / (trend.length - 1)) * (width - padding * 2);
    const y = height - padding - (point.tokens / max) * (height - padding * 2);
    return [x, y] as const;
  });

  const path = toPath(points);
  const areaPath = path
    ? `${path} L ${points.at(-1)?.[0] ?? width} ${height - padding} L ${points[0]?.[0] ?? 0} ${
        height - padding
      } Z`
    : "";

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="token 趋势">
      <path className="sparkline-area" d={areaPath} />
      <path className="sparkline-line" d={path} pathLength={1} />
    </svg>
  );
}

function toPath(points: ReadonlyArray<readonly [number, number]>) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    const [x, y] = points[0];
    return `M ${x} ${y} L ${x + 1} ${y}`;
  }

  return points
    .map(([x, y], index) => {
      if (index === 0) {
        return `M ${x} ${y}`;
      }

      const [previousX, previousY] = points[index - 1];
      const controlX = (previousX + x) / 2;
      return `C ${controlX} ${previousY}, ${controlX} ${y}, ${x} ${y}`;
    })
    .join(" ");
}
