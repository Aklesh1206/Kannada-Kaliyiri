import Link from "next/link";
import { HomePath } from "@/components/HomePath";
import { StatBar } from "@/components/StatBar";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24">
      <header className="flex items-center justify-between gap-4 py-5">
        <p className="text-xl font-extrabold">
          Kannada Kaliyiri
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="press flex items-center gap-1.5 rounded-xl border-2 border-line bg-raised px-3 py-1.5 text-sm font-bold text-ink hover:border-arishina-deep shadow-xs"
          >
            <span>👤</span>
            <span>Account</span>
          </Link>
          <StatBar />
        </div>
      </header>
      <main>
        <HomePath />
      </main>
    </div>
  );
}
