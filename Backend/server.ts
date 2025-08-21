import WebSocket, { WebSocketServer } from 'ws';
import { handleMessage } from './wsRouter';
import { registerClient, removeClient } from './client';

const wss = new WebSocketServer({ port: 8080 });
let connectionCount = 0;

wss.on('connection', (ws: WebSocket) => {
  connectionCount++;
  registerClient(ws);
  console.log('Client connected');
  console.log('Client IP:', (ws as any).socket?.remoteAddress);
  console.log('User Agent:', (ws as any).request?.headers['user-agent']);
  ws.on('message', async (data: WebSocket.RawData) => {
    try {
      const message = JSON.parse(data.toString());
      await handleMessage(ws, message);
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', payload: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    removeClient(ws);
  });
});

console.log('✅ WebSocket server running on ws://localhost:8080');
