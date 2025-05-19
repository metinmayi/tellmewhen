"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function JoinCalendar() {
  const [code, setCode] = useState("");
  const router = useRouter();

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (code) router.push(`/calendar/${code}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-zinc-900">
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="bg-zinc-800 text-zinc-100 px-4 py-2 rounded-lg font-semibold shadow hover:bg-zinc-700 border border-zinc-600 transition text-sm"
        >
          Home
        </Link>
      </div>
      <div className="w-full max-w-xs flex flex-col items-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 text-center text-zinc-100 drop-shadow">
          Join a Calendar
        </h1>
        <p className="mb-8 text-center text-zinc-300 text-base sm:text-lg">
          Enter your calendar code to join an existing calendar.
        </p>
        <form onSubmit={handleJoin} className="flex flex-col w-full gap-4">
          <input
            className="w-full px-4 py-3 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-600 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-700 text-lg"
            placeholder="Calendar code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full px-6 py-4 bg-sky-700 text-white rounded-lg text-lg font-semibold shadow hover:bg-sky-600 border border-sky-800 transition text-center"
          >
            Join
          </button>
        </form>
      </div>
    </main>
  );
}
