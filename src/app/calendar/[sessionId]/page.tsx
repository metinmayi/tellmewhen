"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Link from "next/link";

export default function CalendarSession() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [input, setInput] = useState("");
  const [showPrompt, setShowPrompt] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    async function checkSession() {
      setLoading(true);
      const res = await fetch(`/api/calendar/${sessionId}/check`);
      if (res.ok) {
        const data = await res.json();
        if (!data.available) {
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }
    if (sessionId) checkSession();
  }, [sessionId]);

  useEffect(() => {
    if (!notFound) {
      const saved = typeof window !== "undefined" && localStorage.getItem(`qp-username-${sessionId}`);
      if (saved) {
        setUsername(saved);
        setShowPrompt(false);
      }
    }
  }, [sessionId, notFound]);

  function handleSetUsername(e: React.FormEvent) {
    e.preventDefault();
    setUsername(input);
    setShowPrompt(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(`qp-username-${sessionId}` , input);
    }
    // Add user to calendar immediately after submitting username
    fetch(`/api/calendar/${sessionId}/availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: "__joined__", username: input, available: true }),
    });
  }

  // Calendar UI logic
  const today = new Date();
  const [calendar, setCalendar] = useState<Record<string, string[]>>({}); // {date: [usernames]}
  const [myAvailability, setMyAvailability] = useState<Set<string>>(new Set());
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [calendarYear, setCalendarYear] = useState<number>(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(today.getMonth());

  // Fetch availability
  useEffect(() => {
    if (!showPrompt && username) {
      fetch(`/api/calendar/${sessionId}/availability`)
        .then(res => res.json())
        .then(data => {
          const map: Record<string, string[]> = {};
          const users = new Set<string>();
          data.availability.forEach((row: { username: string; date: string }) => {
            if (row.date !== "__joined__") {
              if (!map[row.date]) map[row.date] = [];
              map[row.date].push(row.username);
            }
            users.add(row.username);
          });
          setCalendar(map);
          setAllUsers(Array.from(users));
          setMyAvailability(new Set(
            data.availability.filter((row: any) => row.username === username && row.date !== "__joined__").map((row: any) => row.date)
          ));
        });
    }
  }, [showPrompt, username, sessionId]);

  useEffect(() => {
    if (!showPrompt && username && sessionId) {
      if (!socketRef.current) {
        socketRef.current = io("http://localhost:4000");
        socketRef.current.emit("join-session", sessionId);
        socketRef.current.on("refresh-availability", () => {
          fetch(`/api/calendar/${sessionId}/availability`)
            .then(res => res.json())
            .then(data => {
              const map: Record<string, string[]> = {};
              const users = new Set<string>();
              data.availability.forEach((row: { username: string; date: string }) => {
                if (!map[row.date]) map[row.date] = [];
                map[row.date].push(row.username);
                users.add(row.username);
              });
              setCalendar(map);
              setAllUsers(Array.from(users));
              setMyAvailability(new Set(
                data.availability.filter((row: any) => row.username === username).map((row: any) => row.date)
              ));
            });
        });
      } else {
        socketRef.current.emit("join-session", sessionId);
      }
    }
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [showPrompt, username, sessionId]);

  // Handle click on a date
  async function toggleDate(date: string) {
    const available = !myAvailability.has(date);
    await fetch(`/api/calendar/${sessionId}/availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, username, available }),
    });
    if (socketRef.current) {
      socketRef.current.emit("availability-update", { sessionId });
    }
    setMyAvailability(prev => {
      const next = new Set(prev);
      if (available) next.add(date); else next.delete(date);
      return next;
    });
  }

  // Generate days for selected month
  function getMonthDays(year: number, month: number) {
    const days = [];
    const firstDay = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= numDays; d++) days.push(d);
    return days;
  }
  const days = getMonthDays(calendarYear, calendarMonth);

  // Month navigation
  function handlePrevMonth() {
    setCalendarMonth((prev: number) => {
      if (prev === 0) {
        setCalendarYear((y: number) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }
  function handleNextMonth() {
    setCalendarMonth((prev: number) => {
      if (prev === 11) {
        setCalendarYear((y: number) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Render calendar grid
  function renderCalendar() {
    return (
      <div className="grid grid-cols-7 gap-2 sm:gap-4 md:gap-6 mt-4 w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-1 sm:px-4 md:px-8">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center font-semibold text-gray-700 text-xs sm:text-base md:text-lg lg:text-xl xl:text-2xl">{day}</div>
        ))}
        {days.map((d, i) => {
          if (!d) return <div key={i} />;
          const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const usersForDate = calendar[dateStr] || [];
          const everyoneAvailable = allUsers.length > 0 && usersForDate.length === allUsers.length;
          const isMe = myAvailability.has(dateStr);
          let colorClass = "bg-white border-gray-300 text-gray-900";
          if (everyoneAvailable && usersForDate.length > 0) {
            colorClass = "bg-green-400 text-white border-green-500";
          } else if (isMe && usersForDate.length === 1) {
            colorClass = "bg-blue-400 text-white border-blue-500";
          } else if (isMe && usersForDate.length > 1) {
            colorClass = "bg-pink-400 text-white border-pink-500";
          } else if (!isMe && usersForDate.length > 0) {
            colorClass = "bg-pink-400 text-white border-pink-500";
          }
          const tooltip = usersForDate.length > 0 ? usersForDate.join(", ") : "No one selected";
          return (
            <div key={dateStr} className="flex flex-col items-center group relative">
              <button
                className={`w-9 h-9 sm:w-14 sm:h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 rounded flex items-center justify-center border text-xs sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold mb-1 ${colorClass} hover:bg-blue-100 transition relative`}
                onClick={() => toggleDate(dateStr)}
                tabIndex={0}
              >
                {d}
                {usersForDate.length > 0 && (
                  <span className="absolute bottom-1 right-1 bg-gray-900 bg-opacity-80 text-white text-[10px] sm:text-xs rounded-full px-1.5 py-0.5 leading-none pointer-events-none">
                    {usersForDate.length}
                  </span>
                )}
              </button>
              {usersForDate.length > 0 && (
                <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block group-focus-within:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg pointer-events-none">
                  {tooltip}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-[#f9f6f1]">
        <p className="text-lg text-gray-600">Loading...</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-[#f9f6f1]">
        <div className="w-full max-w-xs text-center">
          <h2 className="text-2xl font-bold mb-2 text-red-700">Calendar Not Found</h2>
          <p className="mb-6 text-gray-700">This calendar session does not exist.</p>
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            onClick={() => router.push("/")}
          >
            Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-[#f9f6f1]">
      <div className="absolute top-4 left-4">
        <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition text-sm">Home</Link>
      </div>
      {showPrompt ? (
        <form onSubmit={handleSetUsername} className="flex flex-col gap-4 w-full max-w-xs">
          <input
            className="border rounded px-4 py-2 text-lg"
            placeholder="Enter your name"
            value={input}
            onChange={e => setInput(e.target.value)}
            required
          />
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition" type="submit">
            Join Session
          </button>
        </form>
      ) : (
        <div className="w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl text-center mx-auto">
          <h2 className="text-2xl font-bold mb-2">Welcome, {username}!</h2>
          <p className="mb-6 text-gray-700">Session code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{sessionId}</span></p>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 md:p-8">
            <h3 className="text-lg font-semibold mb-2">Select your available dates</h3>
            <div className="flex items-center justify-between mb-2">
              <button
                className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
              >
                &lt;
              </button>
              <span className="font-semibold text-base sm:text-lg md:text-xl">
                {monthNames[calendarMonth]} {calendarYear}
              </span>
              <button
                className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg"
                onClick={handleNextMonth}
                aria-label="Next Month"
              >
                &gt;
              </button>
            </div>
            {renderCalendar()}
            <p className="mt-4 text-xs text-gray-500">Green = everyone available, Blue = you available, Pink = others available</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 md:p-8 mt-4">
            <h3 className="text-lg font-semibold mb-2">Users in this session</h3>
            <ul className="mb-2">
              {allUsers.map((user) => (
                <li key={user} className={`text-sm ${user === username ? "font-bold text-blue-700" : "text-gray-700"}`}>{user}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
