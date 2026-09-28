import { io } from 'socket.io-client';

// Use same host or fallback to port 5000 in dev
const SOCKET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : window.location.origin;

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // Prefer fast WebSocket first
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      forceNew: false // Ensure we reuse the connection
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to server:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      // If server closed connection, proactively reconnect
      if (reason === 'io server disconnect' || reason === 'transport close') {
        socket.connect();
      }
    });

    socket.io.on('reconnect', (attempt) => {
      console.log('[Socket] Successfully reconnected on attempt:', attempt);
    });

    socket.on('connect_error', (error) => {
      console.warn('[Socket] Connection error:', error.message);
    });
  }

  // Ensure it's connected if called again
  if (!socket.connected && !socket.active) {
    socket.connect();
  }

  return socket;
}

export default getSocket;
