import { NextRequest, NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = await openDb();
  await db.exec('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT)');
  const messages = await db.all('SELECT * FROM messages');
  await db.close();
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const db = await openDb();
  const { text } = await req.json();
  await db.run('INSERT INTO messages (text) VALUES (?)', text);
  const messages = await db.all('SELECT * FROM messages');
  await db.close();
  return NextResponse.json(messages);
}
