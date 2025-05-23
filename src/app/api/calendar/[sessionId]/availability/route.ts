import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/lib/db";

// POST: Mark/unmark a date as available for a user in a session (calendar)
export async function POST(req: NextRequest, props: { params: Promise<{ sessionId: string }> }) {
  const params = await props.params;
  const { date, username, available } = await req.json();
  const db = await openDb();
  await db.exec(
    `CREATE TABLE IF NOT EXISTS calendars (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
  await db.exec(
    `PRAGMA foreign_keys = ON;`
  );
  await db.exec(
    `CREATE TABLE IF NOT EXISTS availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      calendar_id TEXT,
      username TEXT,
      date TEXT,
      available INTEGER,
      UNIQUE(calendar_id, username, date),
      FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE
    )`
  );
  // Get calendar_id for this session
  const calendar_id = params.sessionId;
  const lowerUsername = username ? username.toLowerCase() : "";
  if (available) {
    await db.run(
      `INSERT OR REPLACE INTO availability (calendar_id, username, date, available) VALUES (?, ?, ?, 1)`,
      calendar_id, lowerUsername, date
    );
  } else {
    await db.run(
      `DELETE FROM availability WHERE calendar_id = ? AND username = ? AND date = ?`,
      calendar_id, lowerUsername, date
    );
  }
  await db.close();
  return NextResponse.json({ success: true });
}

// GET: Get all availability for a session (calendar)
export async function GET(_req: NextRequest, props: { params: Promise<{ sessionId: string }> }) {
  const params = await props.params;
  const db = await openDb();
  await db.exec(
    `CREATE TABLE IF NOT EXISTS calendars (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
  await db.exec(
    `PRAGMA foreign_keys = ON;`
  );
  await db.exec(
    `CREATE TABLE IF NOT EXISTS availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      calendar_id TEXT,
      username TEXT,
      date TEXT,
      available INTEGER,
      UNIQUE(calendar_id, username, date),
      FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE
    )`
  );
  // Use sessionId directly as calendar_id
  const calendar_id = params.sessionId;
  const rows = await db.all(
    `SELECT username, date FROM availability WHERE calendar_id = ? AND available = 1`,
    calendar_id
  );
  await db.close();
  return NextResponse.json({ availability: rows });
}
