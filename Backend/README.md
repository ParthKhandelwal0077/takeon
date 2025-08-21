# Takenon Server

A WebSocket-based multiplayer quiz game server with Supabase database integration.

## Features

- Real-time multiplayer quiz games
- WebSocket communication
- Supabase database integration for participant tracking
- Player join notifications with custom names

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` file with your Supabase credentials:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Supabase Setup

Make sure you have the following table in your Supabase database:

```sql
-- game_participants table
CREATE TABLE game_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_score INTEGER DEFAULT 0,
  total_time REAL DEFAULT 0
);
```

### Running the Server

#### Development
```bash
npm run dev
```

#### Production
```bash
npm run build
npm start
```

The server will be available at `ws://localhost:8080`

## API

### WebSocket Messages

#### Create Game
```json
{
  "type": "create_game",
  "payload": {
    "gameId": "your-game-id",
    "userId": "your-user-id",
    "playerName": "Your Display Name"
  }
}
```

#### Join Game
```json
{
  "type": "join_game",
  "payload": {
    "gameId": "existing-game-id",
    "userId": "your-user-id",
    "playerName": "Your Display Name"
  }
}
```

#### Start Game
```json
{
  "type": "start_game",
  "payload": {
    "gameId": "your-game-id",
    "userId": "host-user-id"
  }
}
```

#### Submit Answer
```json
{
  "type": "submit_answer",
  "payload": {
    "gameId": "your-game-id",
    "userId": "your-user-id",
    "answer": "your-answer"
  }
}
```

### Response Messages

#### Player Joined
```json
{
  "type": "player_joined",
  "payload": {
    "message": "Player Name has joined",
    "userId": "user-id",
    "players": ["user1", "user2"],
    "playerName": "Player Name"
  }
}
```

#### Game Created
```json
{
  "type": "game_created",
  "payload": {
    "gameId": "game-id",
    "hostId": "host-user-id"
  }
}
```

#### Error
```json
{
  "type": "error",
  "payload": {
    "message": "Error description",
    "details": "Additional error details"
  }
}
```

## Database Integration

The server automatically saves participant information to the Supabase database when players join games. This includes:

- Game ID
- User ID  
- Join timestamp
- Initial score (0)
- Initial time (0)

Participant stats can be updated during gameplay using the provided database functions. 