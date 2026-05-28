import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LeaderboardRow } from "@/components/leaderboard/LeaderboardRow";

describe("LeaderboardRow", () => {
  it("renders username, tokens, requests, and trend without email or cost", () => {
    const { container } = render(
      <ol>
        <LeaderboardRow
          row={{
            rank: 1,
            userId: "abcdef123456",
            displayName: "operator-a",
            tokens: 1234567,
            requests: 88,
            tokenShare: 0.42,
            averageTokensPerRequest: 14029,
            activeBucketCount: 2,
            latestBucketTokens: 20,
            trend: [
              { bucket: "2026-05-28 00:00", tokens: 10, requests: 1 },
              { bucket: "2026-05-28 01:00", tokens: 20, requests: 2 },
            ],
          }}
        />
      </ol>,
    );

    expect(screen.getByText("operator-a")).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
    expect(screen.getByText("占比")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(screen.getByText("活跃")).toBeInTheDocument();
    expect(screen.getByText("2h")).toBeInTheDocument();
    expect(container.textContent).not.toContain("UID");
    expect(container.textContent).not.toContain("@");
    expect(container.textContent).not.toContain("cost");
    expect(container.querySelector(".sparkline")).not.toBeNull();
  });
});
