#!/bin/bash
set -e

echo "Waiting for database..."
python << END
import sys
import time
import os

# Try psycopg first, fallback to checking env vars
db_host = os.environ.get("DB_HOST", "localhost")
db_port = os.environ.get("DB_PORT", "5432")
db_name = os.environ.get("DB_NAME", "magix")
db_user = os.environ.get("DB_USER", "magix")
db_password = os.environ.get("DB_PASSWORD", "")

# Also support DATABASE_URL
database_url = os.environ.get("DATABASE_URL", "")
if database_url:
    import re
    m = re.match(
        r"postgres(?:ql)?://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)",
        database_url,
    )
    if m:
        db_user, db_password, db_host, db_port, db_name = m.groups()

import socket
for i in range(30):
    try:
        sock = socket.create_connection((db_host, int(db_port)), timeout=2)
        sock.close()
        print("Database ready!")
        sys.exit(0)
    except (socket.error, OSError):
        time.sleep(1)
print("Database not available after 30 seconds")
sys.exit(1)
END

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting application..."
exec "$@"
