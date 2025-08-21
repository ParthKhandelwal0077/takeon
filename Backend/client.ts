import WebSocket from 'ws';

interface ClientMeta {
  userId: string | null;
  gameId: string | null;
}

const clients = new Map<WebSocket, ClientMeta>();

export function registerClient(ws: WebSocket): void {
  clients.set(ws, { userId: null, gameId: null });
}

export function setClientMeta(ws: WebSocket, data: Partial<ClientMeta>): void {
  const existing = clients.get(ws);
  if (existing) {
    clients.set(ws, { ...existing, ...data });
  }
}

export function removeClient(ws: WebSocket): void {
  clients.delete(ws);
}

export function getClientsInGame(gameId: string): [WebSocket, ClientMeta][] {
  return [...clients.entries()].filter(([_, meta]) => meta.gameId === gameId);
}
