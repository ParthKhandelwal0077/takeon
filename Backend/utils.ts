import WebSocket from 'ws';
import { getClientsInGame } from './client';

interface OutgoingMessage {
  type: string;
  payload: any;
}

export function broadcastToGame(gameId: string, message: OutgoingMessage): void {
  const clients = getClientsInGame(gameId);
  const serialized = JSON.stringify(message);

  for (const [ws] of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(serialized);
    }
  }
}
