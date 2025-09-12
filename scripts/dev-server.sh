#!/bin/bash

PORT=14000

echo "🔍 Checking for processes running on port $PORT..."

# Find processes using the port
PIDS=$(lsof -ti:$PORT)

if [ -n "$PIDS" ]; then
    echo "🔥 Killing existing processes on port $PORT:"
    echo "$PIDS" | while read pid; do
        echo "  - Killing process $pid"
        kill -9 $pid 2>/dev/null || echo "    (Process $pid already terminated)"
    done
    
    # Wait a moment for processes to terminate
    sleep 1
    
    # Double-check if any processes are still running
    REMAINING=$(lsof -ti:$PORT)
    if [ -n "$REMAINING" ]; then
        echo "⚠️  Warning: Some processes might still be running on port $PORT"
        lsof -i:$PORT
    else
        echo "✅ Port $PORT is now free"
    fi
else
    echo "✅ Port $PORT is already free"
fi

echo "🚀 Starting development server on port $PORT..."
npx vite --port $PORT --host