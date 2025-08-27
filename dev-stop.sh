#!/bin/bash
# dev-stop.sh - Stop all development services

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping development services...${NC}"

# Read PIDs from file if it exists
if [ -f ".dev-pids" ]; then
    source .dev-pids
    
    if [ ! -z "$CELERY_PID" ]; then
        kill $CELERY_PID 2>/dev/null && echo -e "${GREEN}✓ Celery stopped${NC}"
    fi
    
    if [ ! -z "$FLASK_PID" ]; then
        kill $FLASK_PID 2>/dev/null && echo -e "${GREEN}✓ Flask stopped${NC}"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null && echo -e "${GREEN}✓ Frontend stopped${NC}"
    fi
    
    rm .dev-pids
else
    # Fallback: kill by port
    echo "PID file not found, stopping services by port..."
    
    # Stop Flask (port 5000)
    lsof -ti:5000 | xargs kill -9 2>/dev/null && echo -e "${GREEN}✓ Flask stopped${NC}"
    
    # Stop Frontend (port 3000)
    lsof -ti:3000 | xargs kill -9 2>/dev/null && echo -e "${GREEN}✓ Frontend stopped${NC}"
    
    # Stop Celery (by name)
    pkill -f "celery.*worker" 2>/dev/null && echo -e "${GREEN}✓ Celery stopped${NC}"
fi

# Optionally stop Redis
echo "Stop Redis? (y/n)"
read -r response
if [[ "$response" == "y" ]]; then
    redis-cli shutdown 2>/dev/null && echo -e "${GREEN}✓ Redis stopped${NC}"
fi

echo -e "${GREEN}✅ All services stopped${NC}"

---

