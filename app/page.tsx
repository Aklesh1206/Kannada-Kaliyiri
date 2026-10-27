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
        <div className="flex items-center gap-4">
          <Link href="/account" className="rounded-xl px-2 py-1 text-base font-bold text-ink-soft hover:bg-line/60">
            Account
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
