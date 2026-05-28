import { LeaderboardScreen } from "@/components/leaderboard/LeaderboardScreen";
import { getPublicRuntimeConfig } from "@/lib/env";

export default function Home() {
  return <LeaderboardScreen config={getPublicRuntimeConfig()} />;
}
