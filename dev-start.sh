#!/bin/bash
# dev-start.sh - Start all services in development mode

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting Development Environment...${NC}"

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}Port $1 is already in use${NC}"
        echo "Would you like to kill the process? (y/n)"
        read -r response
        if [[ "$response" == "y" ]]; then
            lsof -ti:$1 | xargs kill -9
            echo -e "${GREEN}Process killed${NC}"
        else
            echo "Please free up port $1 and try again"
            exit 1
        fi
    fi
}

# Check ports
echo "Checking ports..."
check_port 5000  # Flask
check_port 3000  # React
check_port 6379  # Redis

# Start Redis
echo -e "\n${YELLOW}Starting Redis...${NC}"
if ! pgrep -x "redis-server" > /dev/null; then
    redis-server --daemonize yes
    echo -e "${GREEN}✓ Redis started${NC}"
else
    echo -e "${GREEN}✓ Redis already running${NC}"
fi

# Test Redis connection
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis connection successful${NC}"
else
    echo -e "${RED}✗ Redis connection failed${NC}"
    exit 1
fi

# Start Backend services
echo -e "\n${YELLOW}Starting Backend services...${NC}"

# Start Celery in background
cd backend
source venv/bin/activate

echo "Starting Celery worker..."
celery -A celery_worker.celery worker --loglevel=info > ../celery.log 2>&1 &
CELERY_PID=$!
echo -e "${GREEN}✓ Celery started (PID: $CELERY_PID)${NC}"

# Start Flask
echo "Starting Flask server..."
python run.py > ../flask.log 2>&1 &
FLASK_PID=$!
echo -e "${GREEN}✓ Flask started (PID: $FLASK_PID)${NC}"

# Start Frontend
echo -e "\n${YELLOW}Starting Frontend...${NC}"
cd ../frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

# Save PIDs to file for shutdown script
echo "CELERY_PID=$CELERY_PID" > ../.dev-pids
echo "FLASK_PID=$FLASK_PID" >> ../.dev-pids
echo "FRONTEND_PID=$FRONTEND_PID" >> ../.dev-pids

# Wait for services to be ready
echo -e "\n${YELLOW}Waiting for services to be ready...${NC}"
sleep 5

# Check services
echo -e "\n${YELLOW}Checking services...${NC}"
if curl -s http://localhost:5000/health > /dev/null; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
fi

echo -e "\n${GREEN}✅ All services started!${NC}"
echo -e "\n${BLUE}Application URLs:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend:  ${GREEN}http://localhost:5000${NC}"
echo -e "  Health:   ${GREEN}http://localhost:5000/health${NC}"
echo -e "\n${YELLOW}Logs:${NC}"
echo -e "  Celery:   ${GREEN}tail -f celery.log${NC}"
echo -e "  Flask:    ${GREEN}tail -f flask.log${NC}"
echo -e "  Frontend: ${GREEN}tail -f frontend.log${NC}"
echo -e "\n${YELLOW}To stop all services:${NC} ${GREEN}./dev-stop.sh${NC}"

# Keep script running and handle shutdown
trap 'echo -e "\n${YELLOW}Stopping services...${NC}"; kill $CELERY_PID $FLASK_PID $FRONTEND_PID 2>/dev/null; exit' INT TERM

echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"
wait

---

