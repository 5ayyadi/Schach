# Lightweight Chess Backend

A minimal, FEN-based chess game backend built with FastAPI, designed for React frontend integration.

## 🎯 Architecture Overview

This backend follows your exact specifications:
- **Lightweight & minimal** - no overengineering
- **FEN-based communication** - perfect for React + chess.js frontend  
- **Username-only authentication** - no complex auth system
- **Dual communication modes:**
  - **WebSocket** for real-time games (Bullet, Blitz, Rapid, Classical)
  - **RabbitMQ** for correspondence games (Daily)

## Features

### Game Types
- **WebSocket Games**: Real-time chess games with instant move updates
- **Async Games**: Slower-paced games using RabbitMQ pub/sub

### Core Functionality
- Create and join games
- Make and validate chess moves
- Real-time game state synchronization
- Async move publishing via RabbitMQ
- Game persistence in MongoDB

## Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── core/
│   └── settings.py         # Configuration settings
├── models/
│   └── game_models.py      # Game and Move data models
├── schemas/
│   └── game.py             # API request/response schemas
├── services/
│   └── game.py             # Core game business logic
├── routers/
│   ├── game.py             # REST API endpoints
│   └── websocket.py        # WebSocket handling
├── database/
│   └── repository.py       # MongoDB data access
├── queue/
│   └── rabbitmq.py         # RabbitMQ pub/sub manager
└── enums/
    └── game_enums.py       # Game status and type enums
```

## API Endpoints

### REST API
- `POST /api/games/` - Create a new game
- `POST /api/games/{game_id}/join` - Join an existing game
- `POST /api/games/{game_id}/move` - Make a move
- `GET /api/games/{game_id}` - Get game state
- `GET /api/games/` - List all games

### WebSocket
- `WS /ws/{game_id}` - Real-time game communication

## How It Works

### WebSocket Games (Real-time)
1. Client connects to WebSocket endpoint
2. Moves are sent via WebSocket messages
3. Server validates moves using chess.py
4. Valid moves are broadcasted to all clients in the game
5. Game state is updated in MongoDB

### Async Games (RabbitMQ)
1. Moves are made via REST API
2. Server validates moves and updates database
3. Move events are published to RabbitMQ
4. Clients can subscribe to RabbitMQ to receive move updates
5. No real-time requirement - perfect for daily chess games

### RabbitMQ Pub/Sub Flow
```
Client → REST API → Game Service → MongoDB
                  ↓
               RabbitMQ → Subscribers (Other clients)
```

## Setup

1. Install dependencies:
```bash
poetry install
```

2. Start MongoDB and RabbitMQ:
```bash
# MongoDB
sudo systemctl start mongod

# RabbitMQ
sudo systemctl start rabbitmq-server
```

3. Run the server:
```bash
poetry run python main.py
```

## Usage Examples

### Create a WebSocket Game
```bash
curl -X POST "http://localhost:8000/api/games/" \
  -H "Content-Type: application/json" \
  -d '{"player_name": "Alice", "game_type": "websocket"}'
```

### Create an Async Game
```bash
curl -X POST "http://localhost:8000/api/games/" \
  -H "Content-Type: application/json" \
  -d '{"player_name": "Bob", "game_type": "async"}'
```

### Make a Move
```bash
curl -X POST "http://localhost:8000/api/games/{game_id}/move" \
  -H "Content-Type: application/json" \
  -d '{"player_name": "Alice", "move": "e2e4"}'
```

## WebSocket Message Format

### Client to Server
```json
{
  "type": "move",
  "player_name": "Alice",
  "move": "e2e4"
}
```

### Server to Client
```json
{
  "type": "move_made",
  "move": {
    "from_square": "e2",
    "to_square": "e4",
    "piece": "P",
    "player": "Alice",
    "move_number": 1
  },
  "game_state": {
    "board": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    "status": "active",
    "current_player": "black"
  }
}
```

## Key Design Decisions

### Simplicity First
- Minimal file structure
- No complex patterns or abstractions
- Clear separation of concerns
- Easy to understand and modify

### Educational Value
- Well-commented code
- Simple, readable logic
- Standard Python patterns
- Clear data flow

### Technology Choices
- **FastAPI**: Modern, fast, well-documented
- **MongoDB**: Document database, flexible schema
- **RabbitMQ**: Simple pub/sub messaging
- **chess.py**: Battle-tested chess logic
- **Pydantic**: Data validation and serialization

This project demonstrates how to build a complete real-time multiplayer game backend with minimal complexity while using modern Python technologies.
