#!/usr/bin/env bash

# PowerShell-compatible: use with 'bash' from Git Bash or WSL, or adapt for PowerShell if needed
# Path to your SQLite database file
DB_PATH="database.sqlite"
LOG_FILE="logs-cleanup.txt"

# Get current time
CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')

# Count calendars before deletion
COUNT_BEFORE=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM calendars;" 2>&1)
COUNT_BEFORE_STATUS=$?

# Delete old calendars
DELETE_RESULT=$(sqlite3 "$DB_PATH" "PRAGMA foreign_keys = ON; DELETE FROM calendars WHERE createdAt < datetime('now', '-1 week');" 2>&1)
DELETE_STATUS=$?

# Count calendars after deletion
COUNT_AFTER=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM calendars;" 2>&1)
COUNT_AFTER_STATUS=$?

# Write log entry
{
  if [ $COUNT_BEFORE_STATUS -ne 0 ]; then
    echo "$CURRENT_TIME | ERROR counting calendars before deletion: $COUNT_BEFORE"
  fi
  if [ $DELETE_STATUS -ne 0 ]; then
    echo "$CURRENT_TIME | ERROR deleting old calendars: $DELETE_RESULT"
  fi
  if [ $COUNT_AFTER_STATUS -ne 0 ]; then
    echo "$CURRENT_TIME | ERROR counting calendars after deletion: $COUNT_AFTER"
  fi
  if [ $COUNT_BEFORE_STATUS -eq 0 ] && [ $DELETE_STATUS -eq 0 ] && [ $COUNT_AFTER_STATUS -eq 0 ]; then
    echo "$CURRENT_TIME | Calendars before: $COUNT_BEFORE | Calendars after: $COUNT_AFTER"
  fi
} >> "$LOG_FILE"
