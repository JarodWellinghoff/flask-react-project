#!/bin/bash
# dev-clean.sh - Clean development environment

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${YELLOW}Cleaning development environment...${NC}"

# Stop all services first
./dev-stop.sh

# Clean Python
echo "Cleaning Python artifacts..."
find . -type f -name "*.pyc" -delete
find . -type d -name "__pycache__" -delete
find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null
rm -rf backend/.pytest_cache
rm -rf backend/htmlcov
rm -rf backend/.coverage

# Clean logs
echo "Cleaning logs..."
rm -f *.log
rm -rf backend/logs/*
rm -rf frontend/logs/*

# Clean build artifacts
echo "Cleaning build artifacts..."
rm -rf frontend/build
rm -rf frontend/node_modules/.cache

# Clean Redis dump
echo "Clean Redis data? (y/n)"
read -r response
if [[ "$response" == "y" ]]; then
    rm -f dump.rdb
    redis-cli FLUSHALL 2>/dev/null
    echo -e "${GREEN}✓ Redis cleaned${NC}"
fi

# Clean virtual environment
echo "Remove Python virtual environment? (y/n)"
read -r response
if [[ "$response" == "y" ]]; then
    rm -rf backend/venv
    echo -e "${GREEN}✓ Virtual environment removed${NC}"
fi

# Clean node_modules
echo "Remove node_modules? (y/n)"
read -r response
if [[ "$response" == "y" ]]; then
    rm -rf frontend/node_modules
    echo -e "${GREEN}✓ node_modules removed${NC}"
fi

echo -e "${GREEN}✅ Cleanup complete${NC}"

---