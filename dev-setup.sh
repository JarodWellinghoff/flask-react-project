#!/bin/bash
# dev-setup.sh - Automated development setup script

set -e

echo "🚀 Setting up development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisite() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        return 1
    fi
}

echo "Checking prerequisites..."
MISSING_DEPS=0

check_prerequisite "python3" || MISSING_DEPS=1
check_prerequisite "node" || MISSING_DEPS=1
check_prerequisite "npm" || MISSING_DEPS=1
check_prerequisite "redis-cli" || {
    echo -e "${YELLOW}⚠${NC} Redis not found. Attempting to install..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install redis
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y redis-server
    else
        echo -e "${RED}Please install Redis manually${NC}"
        MISSING_DEPS=1
    fi
}

if [ $MISSING_DEPS -eq 1 ]; then
    echo -e "${RED}Please install missing dependencies and try again${NC}"
    exit 1
fi

# Setup Backend
echo -e "\n${YELLOW}Setting up Backend...${NC}"
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${GREEN}✓${NC} Backend .env created"
fi

# Setup Frontend
echo -e "\n${YELLOW}Setting up Frontend...${NC}"
cd ../frontend

# Install dependencies
echo "Installing Node dependencies..."
if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${GREEN}✓${NC} Frontend .env created"
fi

echo -e "\n${GREEN}✅ Development setup complete!${NC}"
echo -e "\nTo start the application, run: ${YELLOW}./dev-start.sh${NC}"

---

