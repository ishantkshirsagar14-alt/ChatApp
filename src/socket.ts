import { io, Socket } from 'socket.io-client';

// Use same host/origin for Socket.io traffic
const SOCKET_URL = window.location.origin;

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
