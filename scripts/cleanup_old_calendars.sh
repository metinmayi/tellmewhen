#!/usr/bin/env bash

# PowerShell-compatible: use with 'bash' from Git Bash or WSL, or adapt for PowerShell if needed
# Path to your SQLite database file
DB_PATH="database.sqlite"
LOG_FILE="logs-cleanup.txt"

# Get current time
CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')

# Count calendars before deletion
COUNT_BEFORE=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM calendars;")

# Delete old calendars
sqlite3 "$DB_PATH" "PRAGMA foreign_keys = ON; DELETE FROM calendars WHERE createdAt < datetime('now', '-1 week');"

# Count calendars after deletion
COUNT_AFTER=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM calendars;")

# Write log entry
{
  echo "$CURRENT_TIME | Calendars before: $COUNT_BEFORE | Calendars after: $COUNT_AFTER"
} >> "$LOG_FILE"
