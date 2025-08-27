#!/bin/bash
# dev-status.sh - Check status of all services

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Development Environment Status${NC}"
echo "================================"

# Check Redis
echo -n "Redis:    "
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
    redis-cli INFO server | grep redis_version
else
    echo -e "${RED}✗ Not running${NC}"
fi

# Check Flask
echo -n "Flask:    "
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running (http://localhost:5000)${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
fi

# Check Celery
echo -n "Celery:   "
if pgrep -f "celery.*worker" > /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
    # Show number of active tasks
    cd backend && source venv/bin/activate 2>/dev/null
    celery -A celery_worker.celery inspect active 2>/dev/null | grep -c "empty" > /dev/null && \
        echo "         No active tasks" || \
        echo "         Has active tasks"
    cd .. 2>/dev/null
else
    echo -e "${RED}✗ Not running${NC}"
fi

# Check Frontend
echo -n "Frontend: "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running (http://localhost:3000)${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
fi

# Check ports
echo -e "\n${YELLOW}Port Usage:${NC}"
echo "Port 3000 (Frontend):"
lsof -i :3000 2>/dev/null | grep LISTEN | head -1 || echo "  Not in use"
echo "Port 5000 (Backend):"
lsof -i :5000 2>/dev/null | grep LISTEN | head -1 || echo "  Not in use"
echo "Port 6379 (Redis):"
lsof -i :6379 2>/dev/null | grep LISTEN | head -1 || echo "  Not in use"

# Check logs
echo -e "\n${YELLOW}Recent Errors:${NC}"
if [ -f "flask.log" ]; then
    echo "Flask errors:"
    grep -i error flask.log | tail -3 2>/dev/null || echo "  No recent errors"
fi
if [ -f "celery.log" ]; then
    echo "Celery errors:"
    grep -i error celery.log | tail -3 2>/dev/null || echo "  No recent errors"
fi

---