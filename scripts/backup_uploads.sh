#!/bin/bash

# Configuration
SOURCE_DIR="/var/www/wedding-tracker/server/uploads"
BACKUP_DIR="/var/backups/wedding-tracker"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="uploads_backup_$DATE.tar.gz"

# Create backup
echo "Starting backup for $SOURCE_DIR..."
tar -czf "$BACKUP_DIR/$FILENAME" -C "$(dirname "$SOURCE_DIR")" "$(basename "$SOURCE_DIR")"

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Backup successful: $BACKUP_DIR/$FILENAME"
else
  echo "Backup failed!"
  exit 1
fi

# Delete backups older than 30 days (keep roughly 4 weeks)
find $BACKUP_DIR -type f -name "uploads_backup_*.tar.gz" -mtime +30 -exec rm {} \;
echo "Old backups cleaned up."
