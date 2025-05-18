"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function JoinCalendar() {
  const [code, setCode] = useState("");
  const router = useRouter();

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (code) router.push(`/calendar/${code}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-[#f9f6f1]">
      <form onSubmit={handleJoin} className="flex flex-col gap-4 w-full max-w-xs">
        <input
          className="border rounded px-4 py-2 text-lg"
          placeholder="Enter calendar code"
          value={code}
          onChange={e => setCode(e.target.value)}
          required
        />
        <button className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition" type="submit">
          Join Calendar
        </button>
      </form>
    </main>
  );
}
