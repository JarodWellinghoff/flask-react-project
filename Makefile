# Makefile - Alternative using Make
.PHONY: help install dev stop clean status test

help:
	@echo "Development Commands:"
	@echo "  make install  - Install all dependencies"
	@echo "  make dev      - Start development environment"
	@echo "  make stop     - Stop all services"
	@echo "  make status   - Check service status"
	@echo "  make clean    - Clean development environment"
	@echo "  make test     - Run all tests"

install:
	@echo "Installing dependencies..."
	@cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
	@cd frontend && npm install
	@echo "✅ Dependencies installed"

dev:
	@./dev-start.sh

stop:
	@./dev-stop.sh

status:
	@./dev-status.sh

clean:
	@./dev-clean.sh

test:
	@echo "Running backend tests..."
	@cd backend && source venv/bin/activate && pytest tests/ -v
	@echo "Running frontend tests..."
	@cd frontend && npm test -- --watchAll=false

test-watch:
	@echo "Starting test watchers..."
	@cd backend && source venv/bin/activate && pytest-watch tests/ &
	@cd frontend && npm test