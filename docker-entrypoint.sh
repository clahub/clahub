#!/bin/sh
set -e

# Validate required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

# For file-based SQLite, ensure the directory exists and is writable
case "$DATABASE_URL" in
  file:*)
    DB_PATH="${DATABASE_URL#file:}"
    DB_DIR="$(dirname "$DB_PATH")"
    mkdir -p "$DB_DIR" 2>/dev/null || true
    if [ ! -w "$DB_DIR" ]; then
      echo "ERROR: Database directory $DB_DIR is not writable" >&2
      exit 1
    fi
    ;;
esac

# Run Prisma schema push (idempotent — safe to run on every start)
echo "Running database migrations..."
npx prisma db push --skip-generate

echo "Database ready. Starting application..."
exec "$@"
