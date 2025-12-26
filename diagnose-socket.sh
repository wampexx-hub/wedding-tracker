#!/bin/bash
# Socket.io Real-time Sync Diagnostic Script

echo "=== Socket.io Diagnostic ==="
echo ""

echo "1. Checking if server is running on port 3001..."
if lsof -i:3001 > /dev/null 2>&1; then
    echo "✅ Server is running on port 3001"
else
    echo "❌ Server is NOT running on port 3001"
    exit 1
fi

echo ""
echo "2. Checking server logs for Socket.io initialization..."
echo "Looking for '[SOCKET]' messages in recent logs..."
echo "(This will show the last 20 socket-related log lines)"
echo ""

# Note: This assumes server logs are being output to console
# In production, you might need to check actual log files

echo "3. Testing Socket.io connection from command line..."
echo "Run this in your browser console to test:"
echo ""
echo "const testSocket = io(window.location.origin, {"
echo "    query: { username: 'dummy2' },"
echo "    transports: ['websocket', 'polling']"
echo "});"
echo ""
echo "testSocket.on('connect', () => console.log('Connected!', testSocket.id));"
echo "testSocket.on('data:updated', () => console.log('Event received!'));"
echo ""

echo "4. Common issues to check:"
echo "   - Is Socket.io client library loaded? (Check browser console for errors)"
echo "   - Is the username being passed correctly in the query?"
echo "   - Are events being emitted from the server? (Check server logs)"
echo "   - Is React Query invalidation working? (Check browser console)"
echo ""

echo "5. Server-side event emission check:"
echo "   When you add an expense/asset, you should see in server logs:"
echo "   [SOCKET] Notifying updates for user: <username>"
echo "   [SOCKET] Emitted 'data:updated' to room: <username>"
echo ""
