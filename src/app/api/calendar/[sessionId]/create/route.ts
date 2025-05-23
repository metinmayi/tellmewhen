import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/lib/db";

// POST /api/calendar/[sessionId]/create
export async function POST(_req: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const db = await openDb();
  await db.exec(
    "CREATE TABLE IF NOT EXISTS calendars (id TEXT PRIMARY KEY, created_at TEXT DEFAULT CURRENT_TIMESTAMP)"
  );
  try {
    await db.run("INSERT INTO calendars (id) VALUES (?)", sessionId);
    await db.close();
    return NextResponse.json({ success: true });
  } catch(error: any) {
    console.error("[Calendar Create Error]", error);
    await db.close();
    return NextResponse.json({ success: false, error: "Calendar already exists" }, { status: 409 });
  }
}
