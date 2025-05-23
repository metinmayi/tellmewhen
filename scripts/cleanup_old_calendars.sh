#!/usr/bin/env bash

# PowerShell-compatible: use with 'bash' from Git Bash or WSL, or adapt for PowerShell if needed
# Path to your SQLite database file
DB_PATH="database.sqlite"

# Delete all entries from the 'calendar' table older than one minute (requires a 'created_at' column of type DATETIME)
sqlite3 "$DB_PATH" "PRAGMA foreign_keys = ON; DELETE FROM calendar WHERE created_at < datetime('now', '-1 minute');"
