#!/bin/bash
set -e

# Run database migrations/initialization
echo "Initializing database..."
python init_db.py

# Start the server
echo "Starting server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
