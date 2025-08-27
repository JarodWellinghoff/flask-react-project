# start-frontend.sh - Start frontend
#!/bin/bash
echo "Starting React Frontend..."

cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start development server
npm start

