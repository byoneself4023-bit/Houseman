#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
mkdir -p "$BACKUP_DIR"

DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="houseman_${DATE}.sql.gz"

docker compose exec -T db pg_dump -U houseman houseman | gzip > "$BACKUP_DIR/$FILENAME"

# 7일 이상 된 백업 삭제
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $FILENAME"
