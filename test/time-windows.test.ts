import { describe, expect, it } from "vitest";
import { buildTimeWindow } from "@/lib/sub2api/time-windows";

describe("buildTimeWindow", () => {
  it("builds hourly buckets for today", () => {
    const now = new Date("2026-05-28T04:35:00.000Z");
    const window = buildTimeWindow("today", "Asia/Shanghai", now);

    expect(window).toMatchObject({
      period: "today",
      startDate: "2026-05-28",
      endDate: "2026-05-28",
      granularity: "hour",
    });
    expect(window.expectedBuckets.at(0)).toBe("2026-05-28 00:00");
    expect(window.expectedBuckets.at(-1)).toBe("2026-05-28 12:00");
  });

  it("builds seven natural days for week", () => {
    const now = new Date("2026-05-28T04:35:00.000Z");
    const window = buildTimeWindow("week", "Asia/Shanghai", now);

    expect(window.startDate).toBe("2026-05-22");
    expect(window.endDate).toBe("2026-05-28");
    expect(window.granularity).toBe("day");
    expect(window.expectedBuckets).toHaveLength(7);
  });

  it("builds thirty natural days for month", () => {
    const now = new Date("2026-05-28T04:35:00.000Z");
    const window = buildTimeWindow("month", "Asia/Shanghai", now);

    expect(window.startDate).toBe("2026-04-29");
    expect(window.endDate).toBe("2026-05-28");
    expect(window.granularity).toBe("day");
    expect(window.expectedBuckets).toHaveLength(30);
  });
});
