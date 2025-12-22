#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/wedding-tracker"
DB_NAME="wedding_db"
DB_USER="wedding_user"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="backup_$DATE.sql.gz"

# Load credentials from .env
if [ -f /var/www/wedding-tracker/.env ]; then
    export $(grep -v '^#' /var/www/wedding-tracker/.env | xargs)
fi

# Export password for pg_dump
export PGPASSWORD=$DB_PASSWORD

# Create backup
echo "Starting backup for $DB_NAME..."
pg_dump -h localhost -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/$FILENAME"

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Backup successful: $BACKUP_DIR/$FILENAME"
else
  echo "Backup failed!"
  exit 1
fi

# Delete backups older than 7 days
find $BACKUP_DIR -type f -name "backup_*.sql.gz" -mtime +7 -exec rm {} \;
echo "Old backups cleaned up."
