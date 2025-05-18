import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/lib/db";

// GET /api/calendar/[sessionId]/check
export async function GET(_req: NextRequest, { params }: { params: { sessionId: string } }) {
  const db = await openDb();
  await db.exec(
    "CREATE TABLE IF NOT EXISTS calendars (id TEXT PRIMARY KEY, createdAt TEXT DEFAULT CURRENT_TIMESTAMP)"
  );
  const row = await db.get("SELECT id FROM calendars WHERE id = ?", params.sessionId);
  await db.close();
  return NextResponse.json({ available: !row });
}

// POST /api/calendar/[sessionId]/create
export async function POST(_req: NextRequest, { params }: { params: { sessionId: string } }) {
  const db = await openDb();
  await db.exec(
    "CREATE TABLE IF NOT EXISTS calendars (id TEXT PRIMARY KEY, createdAt TEXT DEFAULT CURRENT_TIMESTAMP)"
  );
  try {
    await db.run("INSERT INTO calendars (id) VALUES (?)", params.sessionId);
    await db.close();
    return NextResponse.json({ success: true });
  } catch (e) {
    await db.close();
    return NextResponse.json({ success: false, error: "Calendar already exists" }, { status: 409 });
  }
}
