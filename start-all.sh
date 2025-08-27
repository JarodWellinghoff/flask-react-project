# start-all.sh - Start everything
#!/bin/bash
echo "Starting Full Application Stack..."

# Start backend in background
./start-backend.sh &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
sleep 5

# Start frontend
./start-frontend.sh &
FRONTEND_PID=$!

echo "Application started!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo "Press Ctrl+C to stop all services"

# Handle shutdown
trap "echo 'Stopping all services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
wait

# Makefile - Alternative using Make
.PHONY: install run-backend run-frontend run-all clean

install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

run-redis:
	redis-server

run-celery:
	cd backend && celery -A celery_worker.celery worker --loglevel=info

run-flask:
	cd backend && python run.py

run-backend:
	make -j3 run-redis run-celery run-flask

run-frontend:
	cd frontend && npm start

run-all:
	make -j2 run-backend run-frontend

clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	rm -rf backend/venv
	rm -rf frontend/node_modules
	rm -rf frontend/build

docker-up:
	docker-compose up

docker-down:
	docker-compose down

docker-rebuild:
	docker-compose build --no-cache