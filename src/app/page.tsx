"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-[#f9f6f1]">
      <div className="w-full max-w-xs flex flex-col items-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-center text-brown-900 drop-shadow">
          QuickPick
        </h1>
        <p className="mb-8 text-center text-brown-700 text-base sm:text-lg">
          The easiest way to create and join group calendars.
        </p>
        <div className="flex flex-col w-full gap-4">
          <Link
            href="/new-calendar"
            className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold shadow hover:bg-blue-700 transition text-center"
          >
            New Calendar
          </Link>
          <Link
            href="/join-calendar"
            className="w-full px-6 py-4 bg-green-600 text-white rounded-lg text-lg font-semibold shadow hover:bg-green-700 transition text-center"
          >
            Join Calendar
          </Link>
        </div>
      </div>
    </main>
  );
}
