import sqlite3 from 'sqlite3';
// @ts-ignore: No types for 'sqlite'
import { open, Database } from 'sqlite';

// This utility function opens a SQLite database connection
export async function openDb(): Promise<Database> {
  return open({
    filename: './database.sqlite',
    driver: sqlite3.Database,
  });
}
