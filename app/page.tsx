import { HomePath } from "@/components/HomePath";
import { StatBar } from "@/components/StatBar";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24">
      <header className="flex items-center justify-between gap-4 py-5">
        <p className="text-xl font-extrabold">
          Kannada Kaliyiri
        </p>
        <StatBar />
      </header>
      <main>
        <HomePath />
      </main>
    </div>
  );
}
