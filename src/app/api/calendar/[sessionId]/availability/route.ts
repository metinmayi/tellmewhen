import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/lib/db";

// POST: Mark/unmark a date as available for a user in a session (calendar)
export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const { date, username, available } = await req.json();
  const db = await openDb();
  await db.exec(
    `CREATE TABLE IF NOT EXISTS availability (
      sessionId TEXT,
      username TEXT,
      date TEXT,
      available INTEGER,
      PRIMARY KEY (sessionId, username, date)
    )`
  );
  if (available) {
    await db.run(
      `INSERT OR REPLACE INTO availability (sessionId, username, date, available) VALUES (?, ?, ?, 1)`,
      params.sessionId, username, date
    );
  } else {
    await db.run(
      `DELETE FROM availability WHERE sessionId = ? AND username = ? AND date = ?`,
      params.sessionId, username, date
    );
  }
  await db.close();
  return NextResponse.json({ success: true });
}

// GET: Get all availability for a session (calendar)
export async function GET(_req: NextRequest, { params }: { params: { sessionId: string } }) {
  const db = await openDb();
  await db.exec(
    `CREATE TABLE IF NOT EXISTS availability (
      sessionId TEXT,
      username TEXT,
      date TEXT,
      available INTEGER,
      PRIMARY KEY (sessionId, username, date)
    )`
  );
  const rows = await db.all(
    `SELECT username, date FROM availability WHERE sessionId = ? AND available = 1`,
    params.sessionId
  );
  await db.close();
  return NextResponse.json({ availability: rows });
}
