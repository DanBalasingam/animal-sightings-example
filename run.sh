#!/bin/bash

echo ""
echo "Backend PHP API:   http://localhost:8000"
echo "Frontend React App: http://localhost:3000"
echo "(Ctrl+C to stop)"
echo ""

(cd server && php -S localhost:8000) &

cd client
npm run dev -- --port 3000
