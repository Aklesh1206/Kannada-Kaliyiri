import Link from "next/link";
import { LeaderboardView } from "@/components/LeaderboardView";

export const metadata = { title: "Leaderboard | Kannada Kaliyiri" };

export default function LeaderboardPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24">
      <header className="flex items-center gap-4 py-4">
        <Link href="/games" aria-label="Back to games" className="grid h-10 w-10 place-items-center rounded-full text-2xl text-ink-soft hover:bg-line/60">
          ←
        </Link>
        <h1 className="text-2xl font-extrabold">Leaderboard</h1>
      </header>
      <main>
        <LeaderboardView />
      </main>
    </div>
  );
}
