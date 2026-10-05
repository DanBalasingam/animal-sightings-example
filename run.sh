#!/bin/bash

echo ""
echo "Backend PHP API:   http://localhost:8000"
echo "Frontend React App: http://localhost:3000"
echo "(Ctrl+C to stop)"
echo ""

(cd server && php -d display_errors=0 -d upload_max_filesize=10M -d post_max_size=12M -S localhost:8000 index.php) &

cd client
npm run dev -- --port 3000
