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
  const [toast, setToast] = useState("");
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
    const lowerInput = input.trim().toLowerCase();
    setUsername(lowerInput);
    setShowPrompt(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(`qp-username-${sessionId}` , lowerInput);
    }
    // Add user to calendar immediately after submitting username
    fetch(`/api/calendar/${sessionId}/availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: "__joined__", username: lowerInput, available: true }),
    });
  }

  // Helper to capitalize first letter for display
  function displayName(name: string) {
    if (!name) return "";
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  // Calendar UI logic
  const today = new Date();
  const [calendar, setCalendar] = useState<Record<string, string[]>>({});
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
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL);
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
          <div key={day} className="text-center font-semibold text-zinc-300 text-xs sm:text-base md:text-lg lg:text-xl xl:text-2xl">{day}</div>
        ))}
        {days.map((d, i) => {
          if (!d) return <div key={i} />;
          const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const usersForDate = calendar[dateStr] || [];
          const everyoneAvailable = allUsers.length > 0 && usersForDate.length === allUsers.length;
          const isMe = myAvailability.has(dateStr);
          const othersSelected = usersForDate.length > 1 && isMe;
          let colorClass = "bg-zinc-900 border-zinc-700 text-zinc-200";
          if (everyoneAvailable && usersForDate.length > 0) {
            colorClass = "bg-emerald-700 text-white border-emerald-800";
          } else if (isMe && usersForDate.length === 1) {
            colorClass = "bg-sky-700 text-white border-sky-800";
          } else if (isMe && usersForDate.length > 1) {
            colorClass = "bg-yellow-700 text-white border-yellow-800";
          } else if (!isMe && usersForDate.length > 0) {
            colorClass = "bg-yellow-700 text-white border-yellow-800";
          }
          const tooltip = usersForDate.length > 0 ? usersForDate.join(", ") : "No one selected";
          return (
            <div key={dateStr} className="flex flex-col items-center group relative">
              <button
                className={`w-9 h-9 sm:w-14 sm:h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 rounded flex items-center justify-center border text-xs sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold mb-1 ${colorClass} hover:bg-zinc-700 transition relative`}
                onClick={() => toggleDate(dateStr)}
                tabIndex={0}
              >
                {d}
                {othersSelected && (
                  <span className="absolute top-1 left-1 w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-400 border-2 border-white"></span>
                )}
                {usersForDate.length > 0 && (
                  <span className="absolute bottom-1 right-1 bg-zinc-900 bg-opacity-80 text-white text-[10px] sm:text-xs rounded-full px-1.5 py-0.5 leading-none pointer-events-none">
                    {usersForDate.length}
                  </span>
                )}
              </button>
              {usersForDate.length > 0 && (
                <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block group-focus-within:block bg-zinc-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg pointer-events-none">
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
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-zinc-900">
        <p className="text-lg text-gray-300">Loading...</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-zinc-900">
        <div className="w-full max-w-xs text-center">
          <h2 className="text-2xl font-bold mb-2 text-red-500">Calendar Not Found</h2>
          <p className="mb-6 text-zinc-300">This calendar does not exist. Calendars get deleted after 7 days.</p>
          <button
            className="bg-sky-700 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-sky-600 border border-sky-800 transition"
            onClick={() => router.push("/")}
          >
            Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-zinc-900">
      <div className="absolute top-4 left-4">
        <Link href="/" className="bg-zinc-800 text-zinc-100 px-4 py-2 rounded-lg font-semibold shadow hover:bg-zinc-700 border border-zinc-600 transition text-sm">Home</Link>
      </div>
      {showPrompt ? (
        <>
          <div className="w-full max-w-md mx-auto mb-6 text-center">
            <p className="text-zinc-400 text-xs sm:text-sm">Each calendar is automatically deleted after <span className="text-emerald-300 font-semibold">one week</span></p>
            <p className="text-yellow-500 text-xs sm:text-sm mt-2 font-medium">Use a unique username in your group—ideally your real name. If needed, add your last name or initials.</p>
          </div>
          <form onSubmit={handleSetUsername} className="flex flex-col gap-4 w-full max-w-xs">
            <input
              className="border border-zinc-600 bg-zinc-800 text-zinc-100 rounded px-4 py-2 text-lg placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-700"
              placeholder="Enter your name"
              value={input}
              onChange={e => setInput(e.target.value)}
              required
            />
            <button className="bg-emerald-700 text-white px-6 py-3 rounded-lg text-lg font-semibold shadow hover:bg-emerald-600 border border-emerald-800 transition" type="submit">
              Join Calendar
            </button>
          </form>
        </>
      ) : (
        <div className="w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl text-center mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-zinc-100">Welcome, {displayName(username)}!</h2>
          <div className="flex justify-center mb-6">
            <button
              className="bg-sky-700 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-sky-600 border border-sky-800 transition text-sm"
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  setToast("Link copied! No more excuses—time to pick a date");
                  setTimeout(() => setToast(""), 3000);
                }
              }}
            >
              Click to Share
            </button>
          </div>
          {toast && (
            <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded shadow border border-emerald-800 z-50 animate-fade-in font-semibold text-base">
              {toast}
            </div>
          )}
          <div className="bg-zinc-800 rounded-lg shadow p-4 sm:p-6 md:p-8 border border-zinc-700">
            <h3 className="text-lg font-semibold mb-2 text-zinc-100">Select your available dates</h3>
            <div className="flex items-center justify-between mb-2">
              <button
                className="px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-bold text-lg border border-zinc-600"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
              >
                &lt;
              </button>
              <span className="font-semibold text-base sm:text-lg md:text-xl text-zinc-100">
                {monthNames[calendarMonth]} {calendarYear}
              </span>
              <button
                className="px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-bold text-lg border border-zinc-600"
                onClick={handleNextMonth}
                aria-label="Next Month"
              >
                &gt;
              </button>
            </div>
            {renderCalendar()}
            {/* Updated legend with colored dots - mobile friendly */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 mt-4">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-emerald-700 border border-emerald-800"></span>
                <span className="text-xs text-zinc-400">Everyone Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-sky-700 border border-sky-800"></span>
                <span className="text-xs text-zinc-400">You&#39;re Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-yellow-700 border border-yellow-800"></span>
                <span className="text-xs text-zinc-400">Others Available</span>
              </div>
            </div>
            {/* End legend */}
          </div>
          <div className="bg-zinc-800 rounded-lg shadow p-4 sm:p-6 md:p-8 mt-4 border border-zinc-700">
            <h3 className="text-lg font-semibold mb-2 text-zinc-100">Users in this calendar</h3>
            <ul className="mb-2">
              {allUsers.map((user) => (
                <li key={user} className={`text-sm ${user === username ? "font-bold text-emerald-400" : "text-zinc-200"}`}>{displayName(user)}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
