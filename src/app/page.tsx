"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-zinc-900">
      <div className="w-full max-w-xs flex flex-col items-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-center text-zinc-100 drop-shadow">
          QuickPick
        </h1>
        <p className="mb-8 text-center text-zinc-300 text-base sm:text-lg">
          No more group chat chaos.
        </p>
        <div className="flex flex-col w-full gap-4">
          <Link
            href="/new-calendar"
            className="w-full px-6 py-4 bg-emerald-700 text-white rounded-lg text-lg font-semibold shadow hover:bg-emerald-600 border border-emerald-800 transition text-center"
          >
            New Calendar
          </Link>
          <Link
            href="/join-calendar"
            className="w-full px-6 py-4 bg-sky-700 text-white rounded-lg text-lg font-semibold shadow hover:bg-sky-600 border border-sky-800 transition text-center"
          >
            Join Calendar
          </Link>
        </div>
      </div>
    </main>
  );
}
