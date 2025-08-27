#!/bin/bash
# start-backend.sh - Start backend services

echo "Starting Flask + Celery Backend..."

# Check if Redis is running
if ! pgrep -x "redis-server" > /dev/null; then
    echo "Starting Redis..."
    redis-server --daemonize yes
fi

# Navigate to backend directory
cd backend

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

# Start Celery worker in background
echo "Starting Celery worker..."
celery -A celery_worker.celery worker --loglevel=info &
CELERY_PID=$!

# Start Flask server
echo "Starting Flask server..."
python run.py &
FLASK_PID=$!

echo "Backend services started!"
echo "Flask PID: $FLASK_PID"
echo "Celery PID: $CELERY_PID"
echo "Press Ctrl+C to stop all services"

# Wait and handle shutdown
trap "echo 'Stopping services...'; kill $FLASK_PID $CELERY_PID; exit" INT TERM
wait

