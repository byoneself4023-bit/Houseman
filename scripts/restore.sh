#!/bin/bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: ./scripts/restore.sh <backup_file.sql.gz>"
  exit 1
fi

if [ ! -f "$1" ]; then
  echo "Error: File '$1' not found"
  exit 1
fi

gunzip -c "$1" | docker compose exec -T db psql -U houseman -d houseman

echo "Restore completed from $1"
