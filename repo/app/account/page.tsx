import Link from "next/link";
import { AccountPanel } from "@/components/AccountPanel";

export const metadata = { title: "Account | Kannada Kaliyiri" };

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24">
      <header className="flex items-center gap-4 py-4">
        <Link href="/" aria-label="Back to the path" className="grid h-10 w-10 place-items-center rounded-full text-2xl text-ink-soft hover:bg-line/60">
          ←
        </Link>
        <h1 className="text-2xl font-extrabold">Account</h1>
      </header>
      <main>
        <AccountPanel />
      </main>
    </div>
  );
}
