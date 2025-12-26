// Test Socket.io Connection
// Run this in browser console to test socket connection

const testSocket = io(window.location.origin, {
    query: { username: 'dummy2' }, // Change to your test username
    transports: ['websocket', 'polling']
});

testSocket.on('connect', () => {
    console.log('✅ TEST: Socket connected!', testSocket.id);
    console.log('Transport:', testSocket.io.engine.transport.name);
});

testSocket.on('connect_error', (error) => {
    console.error('❌ TEST: Connection error:', error);
});

testSocket.on('data:updated', () => {
    console.log('🔔 TEST: data:updated event received!');
    alert('Socket event received!');
});

testSocket.on('disconnect', (reason) => {
    console.log('⚠️ TEST: Disconnected:', reason);
});

console.log('Test socket initialized. Check logs above.');
